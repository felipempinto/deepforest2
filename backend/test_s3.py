import os
import boto3
from botocore.config import Config

AWS_S3_REGION_NAME = "us-east-2"
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID_DF_WEBSITE')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY_DF_WEBSITE')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME_DF_WEBSITE')


print(AWS_S3_REGION_NAME)
print(AWS_ACCESS_KEY_ID)
print(AWS_SECRET_ACCESS_KEY)
print(AWS_STORAGE_BUCKET_NAME)


my_config = Config(

    region_name = AWS_S3_REGION_NAME,
    # signature_version = 's3v4',
)

s3_client = boto3.client('s3',
                         aws_access_key_id=AWS_ACCESS_KEY_ID,
                         aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                         config=my_config,
                         )


# mask = 'static/products/LandCover2.png'
mask = 'static/products/forestmask.png'
expiration = 1200

response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': AWS_STORAGE_BUCKET_NAME,
                                                            'Key': mask},
                                                    ExpiresIn=expiration)

print(response)