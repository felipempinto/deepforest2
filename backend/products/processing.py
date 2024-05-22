import boto3
import paramiko
import os,time
import datetime
from django.conf import settings
from django.core.mail import send_mail
import json

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

# def get_name(inst):

#     client = get_aws("ec2")
#     #TODO: 
#     # Não ta conseguindo encontrar a instancia se ela é parada após essa
#     # função ser chamada, precisa encontrar uma solução.

#     response = client.describe_instances(InstanceIds = inst)
#     # with open('dataAAA.json', 'w') as f:
#     #     a = json.dumps(response, indent=4, sort_keys=True, default=str)
#     #     json.dump(a, f)
        
#     foo = response['Reservations'][0]['Instances'][0]['NetworkInterfaces'][0]['Association']['PublicDnsName']
#     return foo


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


def get_instance(
                # ec2,
                # instance_id=['i-0414e78255d655284'],
                instance_id = 'i-0414e78255d655284',
                ):
    
    ec2 = get_aws("ec2")
    
    response = ec2.describe_instance_status(
        InstanceIds=[instance_id],
        IncludeAllInstances=True
    )
    
    response = response['InstanceStatuses'][0]['InstanceState']['Name'] 
    response_status = response == 'stopped'
    print("RESPOSE",response)
    if not response_status:
        return 
    else:
        ec2.start_instances(InstanceIds=[instance_id])
        print("Instance is starting...")
        t1 = time.time()
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        print(f"It took {time.time()-t1} seconds to turn on the instance.")

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
            pkey=privkey
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
        date,
        bounds,
        pth,
        output,
        config_file,
        product,
        ec2_name,
        pem = 'Forestmaskkeys.pem',
        mode="production",
        verbose=True
        ):
    ssh = connect_with_ssh(pem,ec2_name)

    

    if mode=="production":
        arguments = f'-d {date} -b "{bounds}" -p "{pth}" -o "{output}" -c "{config_file}" -u {product}'
        if verbose:
            print("ARGS")
            print(arguments)
            print("#"*50)
        cmd = f'python3 deepforest_remote_process/process_selected.py {arguments}'
    elif mode == "test-error":
        cmd = f'python3 deepforest_remote_process/test.py e' #FOR ERROR
    elif mode == "test-sucess":
        cmd = f'python3 deepforest_remote_process/test.py s' #FOR SUCESS

    t1 = time.time()
    stdin, stdout, stderr = ssh.exec_command( cmd )
    if verbose:
        print("PROCESSING DONE")
        print(f"Total time of the processing: {datetime.timedelta(time.time()-t1)}")
    
    error = stderr.read().decode('utf-8')
    if error!='':
        print("Returning on error")
        # raise Exception(error)

    stdin.flush()
    data = stdout.read().splitlines()
    final = None

    for line in data:
        l = line.decode('utf-8')
        if l.endswith('.tif'):
            final = l
    ssh.close()

    return final,error


# def run_process(
#         date,
#         bounds,
#         pth,
#         output,
#         config_file,
#         product,
#         ec2,# = get_aws("ec2")
#         ec2_name,
#         pem = 'Forestmaskkeys.pem',
#         instance_id=['i-0414e78255d655284'],
#         verbose=True
#         ):

#     response = ec2.describe_instance_status(InstanceIds=instance_id,
#         IncludeAllInstances=True
#     )

#     response = response['InstanceStatuses'][0]['InstanceState']['Name'] 
#     response_status = response == 'stopped'
#     # response_status = response == 'running'
#     # response_stopping = response == 'stopping'

#     while response_stopping:
#         if verbose:
#             print("Waiting 10 seconds until instance stops")
#         time.sleep(10)
        
#         response = response['InstanceStatuses'][0]['InstanceState']['Name'] 
#         response_status = response == 'running'
#         response_stopping = response == 'stopping'
        
#     if not response_status and not response_stopping:
#         ec2.start_instances(InstanceIds=instance_id)
#         if verbose:
#             t1 = time.time()
#             print("Instance is starting...")
#         waiter = ec2.get_waiter('instance_running')
#         waiter.wait(InstanceIds=instance_id)
#         if verbose:
#             print(f"It took {time.time()-t1} seconds to turn on the instance.")

#     ssh = paramiko.SSHClient()
#     ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
#     privkey = paramiko.RSAKey.from_private_key_file(pem)

#     while True:
#         try:
#             ssh.connect(
#             # get_name(instance_id),
#             ec2_name,
#             username='ubuntu', 
#             pkey=privkey
#         )
#         except paramiko.ssh_exception.NoValidConnectionsError:
#             print("Error with ssh connection, waiting 10 seconds")
#             time.sleep(10)
#         except paramiko.ssh_exception.SSHException:
#             raise paramiko.ssh_exception.SSHException("Error when connecting the instance with SSH, please, check the ")
#         except KeyError:
#             print("Error with the response keys (probably recently closed), waiting 10 seconds")
#             time.sleep(10)
#         else:
#             break

#     arguments = f'-d {date} -b "{bounds}" -p "{pth}" -o "{output}" -c "{config_file}" -u {product}'
#     print(arguments)
#     stdin, stdout, stderr = ssh.exec_command(
#         f'python3 deepforest_remote_process/process_selected.py {arguments}'
#         # f'python3 deepforest_remote_process/test.py s' #FOR SUCESS
#         # f'python3 deepforest_remote_process/test.py e' #FOR ERROR
#         )
#     error = stderr.read().decode('utf-8')
#     if error!='':
#         raise Exception(error)

#     stdin.flush()
#     data = stdout.read().splitlines()
#     final = None

#     for line in data:
#         l = line.decode('utf-8')
#         if l.endswith('.tif'):
#             final = l
#     ssh.close()

#     # ec2.stop_instances(InstanceIds=instance_id)
#     return final,error


def process(date,bounds,pth,output,config_file,product,verbose=True):
    instance_id = [
        'i-0414e78255d655284',#TODO: Add this information in the .env file
        # "",                 #Here you can add more instances copy
        ]
    print("A")
    for inst in instance_id:
        ec2 = get_instance(inst)
        if ec2 is not None:
            break

    print("B")
    if ec2 is None:
        raise Exception("The instances are not ready to be used")

    ec2,ec2_name = ec2
    print("C")
    try:
        final,error = run_process(date,bounds,pth,output,config_file,product,ec2_name,verbose=verbose)
    except Exception as e:
        ec2.stop_instances(InstanceIds=instance_id)
        raise Exception(e)
    else:
        ec2.stop_instances(InstanceIds=instance_id)
        return final,error
        
        
# run_on_instance()


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
    

def send_emails(user,admin_email,date,tp="error",e="",users=["admin","user"],processtime=""):
    
    for us in users:
        emailto = admin_email if us=="admin" else user.email
        send_mail(
            f"DEEPFOREST: {tp} while processing",
            get_messages(tp,us,date,user,e=e,process_time=processtime),
            admin_email,
            [emailto],
            fail_silently=False,
        )
