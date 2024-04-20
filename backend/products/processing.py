import boto3
import paramiko
import os,time
from django.conf import settings
import json

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

    client = get_aws("ec2")
    #TODO: 
    # Não ta conseguindo encontrar a instancia se ela é parada após essa
    # função ser chamada, precisa encontrar uma solução.

    response = client.describe_instances(InstanceIds = inst)
    # with open('dataAAA.json', 'w') as f:
    #     a = json.dumps(response, indent=4, sort_keys=True, default=str)
    #     json.dump(a, f)
        
    foo = response['Reservations'][0]['Instances'][0]['NetworkInterfaces'][0]['Association']['PublicDnsName']
    return foo


# TODO: Testing scenarios
# -> Instance already turned on
# -> Instance stopping
# -> Instance stopped


def process(
        date,
        bounds,
        pth,
        output,
        config_file,
        product,
        verbose=True
        ):

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

    #TODO: PROBLEMA COM SE A INSTANCIA TA LIGADA
    # if response_status:
    #     waiter = ec2.get_waiter('instance_stopped')
    #     waiter.wait(InstanceIds=instance_id)

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
            print("Error with ssh connection, waiting 10 seconds")
            time.sleep(10)
        except KeyError:
            print("Error with the response keys (probably recently closed), waiting 10 seconds")
            time.sleep(10)
        else:
            break

    # EXPECTED INPUT FORMAT

    # 20240318 
    # SRID=4326;MULTIPOLYGON (((-51.47644 -27.412157, -51.784058 -27.684896, -51.410522 -27.869582, -51.124878 -27.548611, -51.47644 -27.412157))) 
    # https://deepforestweb.s3.amazonaws.com/models/v0.0.0/forestmask/net.pth?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVHNKLCXSZQGFRLTK%2F20240420%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20240420T155705Z&X-Amz-Expires=1200&X-Amz-SignedHeaders=host&X-Amz-Signature=cd4566604169e1f41ebd094361dd93e6f9445da439be4589981416e4fe7a7cf2 
    # processed/1/forestmask/0.0.0/20240318/e6c8ba83534c4a31b82ea2a6ec1decdf.tif 
    # https://deepforestweb.s3.amazonaws.com/static/models/Forest%20Mask/files/commandline_args_TU2SWoX.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVHNKLCXSZQGFRLTK%2F20240420%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20240420T155705Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=631563e0bdf927ed81af37c9c86f74d1ae590a14a43d036ac674b36f40f44c16 
    # forestmask

    arguments = f'-d {date} -b "{bounds}" -p "{pth}" -o "{output}" -c "{config_file}" -u {product}'
    print(arguments)

    stdin, stdout, stderr = ssh.exec_command(
        # f'python3 deepforest_remote_process/process_datasets.py'
        f'python3 deepforest_remote_process/process_selected.py {arguments}'
        )
    
    error = stderr.read().decode('utf-8')
    if error!='':
        print(error)
        return
        # raise Exception(f'Error while trying to create forestmask:\n{error}')

    stdin.flush()
    data = stdout.read().splitlines()
    final = None
    for line in data:
        
        l = line.decode('utf-8')
        print(line,l)
        if l.endswith('.tif'):
            final = l

    ssh.close()
    # os.remove(pem)

    if not response:
        print("Stopping instance")
        ec2.stop_instances(InstanceIds=instance_id)
    
    return final

    

# run_on_instance()

