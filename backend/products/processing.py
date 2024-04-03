import boto3
import paramiko
import os,time
from django.conf import settings

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

def get_name(inst):
    # inst = ['i-0414e78255d655284']

    client = get_aws("ec2")
    # response = client.describe_instances(InstanceIds = [inst[0].instance_id])
    response = client.describe_instances(InstanceIds = inst)
    foo = response['Reservations'][0]['Instances'][0]['NetworkInterfaces'][0]['Association']['PublicDnsName']
    return foo


# TODO: Testing scenarios
# -> Instance already turned on
# -> Instance stopping
# -> Instance stopped


def run_on_instance(verbose=True):
    # s3 = get_aws("s3")
    ec2 = get_aws("ec2")

    # bucket = settings.AWS_STORAGE_BUCKET_NAME
    pem = 'Forestmaskkeys.pem'


    instance_id = ['i-0414e78255d655284']

    response = ec2.describe_instance_status(InstanceIds=instance_id,
        IncludeAllInstances=True
    )
    # print(response)

    response = response['InstanceStatuses'][0]['InstanceState']['Name'] 
    response_status = response == 'running'
    response_stopping = response == 'stopping'
    if verbose:
        print(f"Running: {response_status}, Stopping: {response_stopping}")

    if response_status:
        waiter = ec2.get_waiter('instance_stopped')
        waiter.wait(InstanceIds=instance_id)

    while response_stopping:
        if verbose:
            print("Waiting 10 seconds until instance stops")
        time.sleep(10)
        
        response = response['InstanceStatuses'][0]['InstanceState']['Name'] 
        response_status = response == 'running'
        response_stopping = response == 'stopping'
        
    if not response_status and not response_stopping:
        ec2.start_instances(InstanceIds=instance_id)
        if verbose:
            t1 = time.time()
            print("Instance is starting...")
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=instance_id)
        if verbose:
            print(f"It took {time.time()-t1} seconds to turn on the instance.")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    privkey = paramiko.RSAKey.from_private_key_file(pem)

    while True:
        try:
            ssh.connect(
            get_name(instance_id),
            username='ubuntu', 
            pkey=privkey
        )
        except paramiko.ssh_exception.NoValidConnectionsError:
            print("Error, waiting 10 seconds")
            time.sleep(10)
        else:
            break

    stdin, stdout, stderr = ssh.exec_command(
        f'python3 deepforest_remote_process/process_datasets.py'
        )
    
    error = stderr.read().decode('utf-8')
    if error!='':
        print(error)
        return
        # raise Exception(f'Error while trying to create forestmask:\n{error}')

    print("AAAAAAAA")
    stdin.flush()
    print("B"*50)
    data = stdout.read().splitlines()
    print("C"*50)
    final = None
    for line in data:
        
        l = line.decode('utf-8')
        print(line,l)
        if l.endswith('.tif'):
            final = l
    print("D"*50)

    ssh.close()
    # os.remove(pem)

    if not response:
        print("Stopping instance")
        ec2.stop_instances(InstanceIds=instance_id)
    
    return final

    

run_on_instance()

