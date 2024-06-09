# from django.db import models
from django.contrib.gis.db import models
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from django.core.exceptions import ValidationError
from django.contrib.humanize.templatetags.humanize import naturaltime
import django_rq

from osgeo import gdal
from shapely.geometry import MultiPolygon,Polygon
from shapely.ops import transform
import pyproj

from botocore.exceptions import ClientError,ParamValidationError
from botocore.config import Config
import boto3

from users.models import User
import os

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
    
def get_bounds(ds):
    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    # return xmin, ymin, xmax, ymax
    poly = Polygon(
            [
                [xmin,ymax],
                [xmax,ymax],
                [xmax,ymin],
                [xmin,ymin]
            ]
        )
    multi = MultiPolygon([poly])

    wgs84 = pyproj.CRS('EPSG:4326')
    utm = ds.GetProjection()

    project = pyproj.Transformer.from_crs(utm, wgs84,  always_xy=True).transform
    multi = transform(project, multi)
    return multi.wkt


class ImagesLocation(models.Model):
    name = models.CharField(max_length=50)
    date = models.DateTimeField()
    img = models.FileField(upload_to="forestmask/train_areas/",null=True,blank=True)
    poly = models.MultiPolygonField(null=True,blank=True)

    def __str__(self):
        return f'{self.name}-{self.date}'
    
    def save(self):
        super(ImagesLocation, self).save()
        if self.poly is None:
            ds = gdal.Open(self.img.url)
            bounds = get_bounds(ds)
            self.poly = GEOSGeometry(bounds)
            self.save()


def classify_and_save_mask(request,req_mask):
    # key = request_img_process_ssh(img)
    key = process_data(request)
    req_mask.mask = key
    req_mask.done = True
    req_mask.save()

class RequestMask(models.Model):
    name = models.CharField(max_length=50)
    bounds = models.MultiPolygonField(null=True,blank=True)
    mask = models.CharField(max_length=200,blank=True,null=True)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

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

    def get_create_at(self):
        return naturaltime(self.created_at)
    
    def get_updated_at(self):
        return naturaltime(self.updated_at)

    def save(self):
        super(RequestMask, self).save()
        if not self.done:

            image = f'{BUCKET}/static/{str(self.image)}'

            request = {
                'image':image,
                'bounding_box':self.bounding_box,
            }

            job = django_rq.enqueue(
                classify_and_save_mask,
                args=(request,self)
                )
#######################################################################################
