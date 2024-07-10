import boto3
import paramiko
import os,time
import datetime
from django.conf import settings
from django.core.mail import send_mail
import json

EMAIL_HOST_USER  = settings.EMAIL_HOST_USER 
INSTANCES = settings.INSTANCES
EMAIL_HOST_USER  = settings.EMAIL_HOST_USER 

def get_aws(name):
    if name=="ec2":
        response = boto3.client(
        "ec2",
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                       )
    elif name=="s3":
        response = boto3.client('s3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        )
    else:
        raise NameError("Provided AWS product name do not exists.")
    
    return response
    

def start_instance(instance):
    ec2 = get_aws("ec2")
    ec2.start_instances(InstanceIds=instance)

def stop_instance(instance):
    ec2 = get_aws("ec2")
    ec2.stop_instances(InstanceIds=instance)

def get_name(ec2,instance_id):
    while True:
        try:
            response = ec2.describe_instances(InstanceIds = [instance_id])
            ec2_name = response['Reservations'][0]['Instances'][0]['NetworkInterfaces'][0]['Association']['PublicDnsName']
        except KeyError:
            print("Error with getting instance name, waitting 10 seconds")
            time.sleep(10)
        else:
            return ec2_name


def get_instance(instance_id):
    
    ec2 = get_aws("ec2")
    
    response = ec2.describe_instance_status(
        InstanceIds=[instance_id],
        IncludeAllInstances=True
    )
    
    response = response['InstanceStatuses'][0]['InstanceState']['Name'] 
    response_status = response == 'stopped'
    if not response_status:
        return 
    else:
        ec2.start_instances(InstanceIds=[instance_id])
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])

        ec2_name = get_name(ec2,instance_id)

        return [ec2,ec2_name]
    


def connect_with_ssh(pem,ec2_name):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    privkey = paramiko.RSAKey.from_private_key_file(pem)

    while True:
        try:
            ssh.connect(
            ec2_name,
            username='ubuntu', 
            pkey=privkey,
            allow_agent=False,
            banner_timeout=200,  # Increase timeout
            timeout=200,
        )
        except paramiko.ssh_exception.NoValidConnectionsError:
            print("Error with ssh connection, waiting 10 seconds")
            time.sleep(10)
        except paramiko.ssh_exception.SSHException:
            raise paramiko.ssh_exception.SSHException("Error when connecting the instance with SSH, please, check the ")
        except KeyError:
            print("Error with the response keys (probably recently closed), waiting 10 seconds")
            time.sleep(10)
        else:
            break
    return ssh


def run_process(
        arguments,
        ec2_name,
        pem = 'Forestmaskkeys.pem',
        ):
    ssh = connect_with_ssh(pem,ec2_name)

    cmd = f'/home/ubuntu/venv/bin/python processingDFNew/process.py {arguments}'
    stdin, stdout, stderr = ssh.exec_command( cmd )

    error = stderr.read().decode('utf-8')
    if error!='':
        # print("Returning on error")
        #TODO:
        # TQDM is passing here, if run using this ssh command, 
        # DO NOT USE TQDM
        raise Exception(error)
    
    stdin.flush()
    data = stdout.read().splitlines()
    final = None

    for line in data:
        l = line.decode('utf-8')
        if l.endswith('.tif'):
            final = l
    ssh.close()
    return final,error

def process(arguments):
    for instance_id in INSTANCES:
        ec2 = get_instance(instance_id)
        if ec2 is not None:
            break    
    if ec2 is None:
        raise Exception("The instances are not ready to be used")

    ec2,ec2_name = ec2

    final,error = run_process(arguments,ec2_name)

    ec2.stop_instances(InstanceIds=[instance_id])
    return final,error

    # try:
    #     final,error = run_process(arguments,ec2_name)
    # except Exception as e:
    #     ec2.stop_instances(InstanceIds=[instance_id])
    #     raise Exception(e)
    # else:
    #     ec2.stop_instances(InstanceIds=[instance_id])
    #     return final,error


def get_messages(tp,us,date,user,e="",process_time=""):
    if tp=="error" and us=="admin":
        return f'You are receiving this message because there was a problem while processing a request, take a look at the error message:\n\n{e}\n\ndate = {date}\nuser = {user.username}'
    elif tp=="error" and us=="user":
        return f"There was an error with your processing, we will check and get back to you\n\nWe are working on solving the problem as soon as possible."        
    elif tp=="sucess" and us=="admin":
        return f"The processing was succeed for user {user.username}\n\n{process_time}"
    elif tp=="sucess" and us=="user":
        return f"Your process is Done, you can check it by acessing:\n\nhttps://deepforest.app/requests\n\n{process_time}\n\nWhy this takes so long?\nThe most optimized way to do this would cost too much "
    else:
        raise TypeError(f"User or Type provided are not correct, please check: type={tp} user={us}")
    

def send_emails(
        self,
        tp,
        error="",
        ):
    
    time_difference = self.updated_at-self.created_at

    hours = time_difference.seconds // 3600
    minutes = (time_difference.seconds % 3600) // 60
    seconds = time_difference.seconds % 60
    process_time = f"Total time of processing: {hours} hours, {minutes} minutes, {seconds} seconds"

    
    users=["admin","user"]
    for us in users:
        emailto = EMAIL_HOST_USER if us=="admin" else self.user.email
        send_mail(
            f"DEEPFOREST: {tp} while processing",
            get_messages(
                tp,
                us,
                self.created_at,
                self.user,
                e=error,
                process_time=process_time
                ),
            EMAIL_HOST_USER,
            [emailto],
            fail_silently=False,
        )
