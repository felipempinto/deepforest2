from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry
from django.core.exceptions import ValidationError
from django.conf import settings
from django.contrib.humanize.templatetags.humanize import naturaltime
import django_rq

from osgeo import gdal, osr
from shapely.geometry import MultiPolygon,Polygon,shape
from shapely.ops import transform
import pyproj

from botocore.exceptions import ClientError,ParamValidationError
from botocore.config import Config
import boto3
import pandas as pd

import uuid
import os
from datetime import datetime

from users.models import User
from main.models import Product,TilesProcessed
# from .download_and_process import process

from PIL import Image
from django.core.files import File
import io

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
    optimizer = models.CharField(max_length=50,default='adamw')


def read_text_file_from_s3(url):
    import requests
    response = requests.get(url)
    response.raise_for_status()  # Check if the request was successful

    file_contents = response.json()
    return file_contents

# class Locations(models.Model):
#     title = models.CharField(max_length=100,null=True, blank=True)
#     geometry = models.PolygonField()
#     created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)


class ModelsTrained(models.Model):
    version = models.CharField(max_length=20)
    description = models.TextField(null=True,blank=True)
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    pth = models.FileField(upload_to=get_upload_pth, null=True, blank=True)
    pth_path = models.CharField(max_length=200,null=True,blank=True)
    poly = models.MultiPolygonField(null=True, blank=True)
    train_csv = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    test_csv = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    file_locations = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    parameters = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def get_pth(self,expiration=1200):
        try:
            pth = self.pth.url
        except ValueError:
            try:
                response = s3_client.generate_presigned_url('get_object',
                                                        Params={'Bucket': BUCKET,
                                                                'Key': self.pth_path},
                                                        ExpiresIn=expiration)
            except (ClientError,ParamValidationError):
                return None
            else:
                return response
        # else:
        return pth
    
    def read_data(self):
        df_train = pd.read_csv(self.train_csv)
        df_test = pd.read_csv(self.test_csv)
        data = {
            "x":df_train["x"],
            "loss_train":df_train["loss"],
            "loss_test":df_train["loss"],
            "acc_train":df_test["acc"],
            "acc_test":df_test["acc"],
                }
        df = pd.DataFrame(data)
        return df.to_dict()

    # def read_test(self):
    #     df = pd.read_csv(self.test_csv)
    #     return df.to_dict()

    def __str__(self):
        return f'{self.product.name} version {self.version}'

    def save(self):
        
        super(ModelsTrained, self).save()
        if self.poly is None:
            import json
            from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon

            content = read_text_file_from_s3(self.file_locations.url)
            print("CONTENT")
            print(type(content))

            geoms = []
            for ft in content["features"]:
                geom_str = json.dumps(ft['geometry'])
                geom = GEOSGeometry(geom_str)
                geoms.append(geom)
            multi = MultiPolygon(geoms)
            self.poly = GEOSGeometry(multi)
            self.save()
            
                # try:
                #     if isinstance(geom, MultiPolygon):
                #         continue
                #     elif isinstance(geom, Polygon):
                #         geom = MultiPolygon([geom])
                #     else:
                #         raise TypeError(
                #             '{} not acceptable for this model'.format(geom.geom_type)
                #         )
                # except TypeError as e:
                #     print(e)

            
            # # multi = content_to_multi(content)
            # multi = GEOSGeometry(content)

            # self.poly = GEOSGeometry(multi)
            # self.save()
            
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

# def requestprocess(self):
#     v = self.pth.version
#     product = self.pth.product.name.lower().replace(' ','')
#     pth = self.pth.get_pth()

#     config_file = self.pth.parameters.url
#     user = self.user.username
#     date = self.date_requested.strftime("%Y%m%d")
#     unique_id = uuid.uuid4().hex

#     output = f'processed/{user}/{product}/{v}/{date}/{unique_id}.tif'
    
#     a = process(
#         date,
#         self.bounds.wkt,
#         pth,
#         output,
#         config_file,
#         product=product,
#         verbose=True
#     )
#     print(a)
#     if self.name=='':
#         self.name = os.path.basename(output).replace('.tif','')
#     self.done = True
#     self.mask = output
#     self.save()

#     #TilesProcessed.update_from_s3()
            
def get_mask_by_url(url,expiration=1200):
        try:
            response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': BUCKET,
                                                            'Key': url},
                                                    ExpiresIn=expiration)
        except (ClientError,ParamValidationError):
            return None
        else:
            return response

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
    
    def geojson(self):
        return self.bounds.geojson

    def save(self, *args, **kwargs):
        super(RequestProcess,self).save(*args, **kwargs)

    def get_mask(self,expiration=1200):
        return get_mask_by_url(self.mask,expiration=expiration)
        # try:
        #     response = s3_client.generate_presigned_url('get_object',
        #                                             Params={'Bucket': BUCKET,
        #                                                     'Key': self.mask},
        #                                             ExpiresIn=expiration)
        # except (ClientError,ParamValidationError):
        #     return None
        # else:
        #     return response
    


def get_bounds(ds):
    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    poly = Polygon([[xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]])
    proj = osr.SpatialReference(wkt=ds.GetProjection())
    epsg = proj.GetAttrValue('AUTHORITY', 1)
    if int(epsg) != 4326:

        wgs84 = pyproj.CRS('EPSG:4326')
        utm = ds.GetProjection()

        project = pyproj.Transformer.from_crs(
            utm, wgs84, always_xy=True
        ).transform
        poly = transform(project, poly)

    return poly.bounds
        
class RequestVisualization(models.Model):
    request = models.ForeignKey(RequestProcess,on_delete=models.CASCADE)
    png = models.FileField(blank=True,null=True)
    bounds = models.CharField(max_length=200,blank=True,null=True)

    def get_png(self,expiration=1200):
        return get_mask_by_url(self.png,expiration=expiration)
    

    def save(self):
        NAME = self.request.mask
        super(RequestVisualization, self).save()
        if self.bounds is None:
            img = gdal.Open(self.request.get_mask())
            ar = img.ReadAsArray()

            bounds = get_bounds(img)
            im1 = Image.fromarray(ar)
            with io.BytesIO() as buffer:
                im1.save(buffer, format='PNG')
                image_data = buffer.getvalue()
            filename = NAME.replace('.tif', '.png')[1:]

            self.bounds = ','.join([str(i) for i in bounds])
            self.png.save(filename, File(io.BytesIO(image_data)))