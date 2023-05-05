from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry
from django.core.exceptions import ValidationError
from django.conf import settings
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
from main.models import Product
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

def get_upload_path(instance, filename):
    return f"models_pth/{instance.product}/{filename}"

class ModelsTrained(models.Model):
    version = models.CharField(max_length=20)
    description = models.TextField()
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    pth = models.FileField(upload_to=get_upload_path, null=True, blank=True)
    poly = models.MultiPolygonField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RequestProcess(models.Model):
    pth = models.ForeignKey(ModelsTrained,on_delete=models.CASCADE,blank=True,null=True)
    mask = models.CharField(max_length=200,blank=True,null=True)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    done = models.BooleanField(default=False)
    bounds = models.MultiPolygonField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)