from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry
from django.core.exceptions import ValidationError
from django.conf import settings
from django.contrib.humanize.templatetags.humanize import naturaltime
import django_rq

from osgeo import gdal
from shapely.geometry import MultiPolygon,Polygon,shape
from shapely.ops import transform
import pyproj

from botocore.exceptions import ClientError,ParamValidationError
from botocore.config import Config
import boto3

import uuid
import os
from datetime import datetime

from users.models import User
from main.models import Product,TilesProcessed
from .download_and_process import process

BUCKET = settings.AWS_STORAGE_BUCKET_NAME

my_config = Config(
    region_name = settings.AWS_S3_REGION_NAME,
    signature_version = 's3v4',
)

gdal.SetConfigOption('AWS_REGION', 'us-east-2')
gdal.SetConfigOption('AWS_ACCESS_KEY_ID', settings.AWS_ACCESS_KEY_ID)
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY',settings.AWS_SECRET_ACCESS_KEY)

s3_client = boto3.client('s3',
                         aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                         aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                         config=my_config,
                         )

# def get_bounds(ds):
#     xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
#     width, height = ds.RasterXSize, ds.RasterYSize
#     xmax = xmin + width * xpixel
#     ymin = ymax + height * ypixel
#     poly = Polygon(
#             [
#                 [xmin,ymax],
#                 [xmax,ymax],
#                 [xmax,ymin],
#                 [xmin,ymin]
#             ]
#         )

#     wgs84 = pyproj.CRS('EPSG:4326')
#     utm = ds.GetProjection()

#     project = pyproj.Transformer.from_crs(utm, wgs84,  always_xy=True).transform
#     poly = transform(project, poly)
#     return poly

def get_upload_pth(instance, filename):
    return f"models/{instance.product}/pth/{filename}"

def get_upload_files(instance, filename):
    return f"models/{instance.product}/files/{filename}"

class TrainModel(models.Model):
    path = models.CharField(max_length=200)
    outpath = models.CharField(max_length=200)
    size = models.IntegerField(default=256)
    batch_size = models.IntegerField(default=10)
    learning_rate = models.FloatField(default=0.00001)
    epochs = models.IntegerField(default=200)
    workers = models.IntegerField(default=0)
    bands = models.IntegerField(default=3)
    classes = models.IntegerField(default=2)
    model = models.CharField(max_length=20,default='unet')
    encoder = models.CharField(max_length=50,default='resnet101')
    loss = models.CharField(max_length=50,default='dice')
    optimizer = models.CharField(max_length=50,default='adam')


def read_text_file_from_s3(url):
    import requests
    response = requests.get(url)
    response.raise_for_status()  # Check if the request was successful

    file_contents = response.text
    return file_contents

def content_to_multi(content):

    multi = GEOSGeometry(multi.wkt)

    return multi

class ModelsTrained(models.Model):
    version = models.CharField(max_length=20)
    description = models.TextField(null=True,blank=True)
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    pth = models.FileField(upload_to=get_upload_pth, null=True, blank=True)
    poly = models.MultiPolygonField(null=True, blank=True)
    train_csv = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    test_csv = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    file_locations = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    parameters = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f'{self.product.name} version {self.version}'

    def save(self):
        super(ModelsTrained, self).save()
        if self.poly is None:

            content = read_text_file_from_s3(self.file_locations.url)
            print("CONTENT")
            print(content)
            
            # multi = content_to_multi(content)
            multi = GEOSGeometry(content)

            self.poly = GEOSGeometry(multi)
            self.save()
            
            # polys = []

            # # with open(self.file_locations.url) as f:
            # content = read_text_file_from_s3(self.file_locations.url)
            # files = content.split('\n')
            # files = [i for i in files if i.replace(' ','')!='']
            # for file in files:
            #     ds = gdal.Open(file)
            #     bounds = get_bounds(ds)
            #     polys.append(bounds)

            # multi = MultiPolygon(polys)
            # multi = GEOSGeometry(multi.wkt)#ogr.CreateGeometryFromWkt(bounds)

            # self.poly = GEOSGeometry(multi)
            # self.save()

def requestprocess(self):
    v = self.pth.version
    product = self.pth.product.name.lower().replace(' ','')
    pth = self.pth.pth.url
    config_file = self.pth.parameters.url
    user = self.user.username
    date = self.date_requested.strftime("%Y%m%d")
    unique_id = uuid.uuid4().hex

    output = f'processed/{user}/{product}/{v}/{date}/{unique_id}.tif'
    
    a = process(
        date,
        self.bounds.wkt,
        pth,
        output,
        config_file,
        product=product,
        verbose=True
    )
    print(a)
    if self.name=='':
        self.name = os.path.basename(output).replace('.tif','')
    self.done = True
    self.mask = output
    self.save()

    #TilesProcessed.update_from_s3()

class RequestProcess(models.Model):
    name = models.CharField(max_length=50,blank=True,null=True)
    pth = models.ForeignKey(ModelsTrained,on_delete=models.CASCADE,blank=True,null=True)
    mask = models.CharField(max_length=200,blank=True,null=True)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    done = models.BooleanField(default=False)
    bounds = models.MultiPolygonField(null=True, blank=True)
    date_requested = models.DateTimeField(default=datetime.now, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.bounds.geojson
    
    def geojson(self):
        return self.bounds.geojson

    def save(self, *args, **kwargs):
        super(RequestProcess,self).save(*args, **kwargs)

    # def save(self):
    #     super(RequestProcess, self).save()

        if not self.done:
            job = django_rq.enqueue(
                requestprocess,
                args=(self,),
                job_timeout=50000
                )
            print("#"*50)
            print("JOB")
            print(job)
            print("#"*50)
            

    def get_mask(self,expiration=1200):
        try:
            response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': BUCKET,
                                                            'Key': self.mask},
                                                    ExpiresIn=expiration)
        except (ClientError,ParamValidationError):
            return None
        else:
            return response