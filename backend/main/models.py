# from django.db import models
from django.contrib.gis.db import models
from django.utils.timezone import make_aware
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry

import boto3
from osgeo import gdal
from shapely.geometry import MultiPolygon,Polygon
from shapely.ops import transform
import pyproj

import time
import datetime

gdal.SetConfigOption('AWS_REGION', 'us-east-2')
gdal.SetConfigOption('AWS_ACCESS_KEY_ID', settings.AWS_ACCESS_KEY_ID)
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY',settings.AWS_SECRET_ACCESS_KEY)

class Product(models.Model):
    name = models.CharField(max_length=50)
    image = models.ImageField(upload_to='products/')
    url = models.CharField(max_length=200)

    def __str__(self):
        return self.name
    

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


class TilesProcessed(models.Model):
    name = models.CharField(max_length=255)
    date_image = models.DateTimeField(null=True,blank=True)
    last_modified = models.DateTimeField()
    size = models.BigIntegerField()
    product = models.CharField(max_length=50)
    poly = models.MultiPolygonField(null=True,blank=True)

    class Meta:
        verbose_name = 'Tile'
        verbose_name_plural = 'Tiles'

    @classmethod
    def update_from_s3(cls, product):
        s3 = boto3.client('s3',
                            region_name='us-east-2',
                            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        )
        bucket_name = 'deepforestbucket'
        prefix = f'{product}/outputs/tiles/sentinel2/'

        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)

        for obj in response['Contents']:
            if not obj['Key'].endswith('/'): 
                name = obj['Key'].split('/')[-1]
                last_modified = obj['LastModified']
                size = obj['Size']
                date_str = name.split('_')[2]
                date_image = datetime.datetime.strptime(date_str, '%Y%m%dT%H%M%S')
                tile, created = cls.objects.update_or_create(name=name, defaults={
                    'last_modified': last_modified,
                    'size': size,
                    'product': product,
                    'date_image': date_image
                })
                if not created:
                    tile.last_modified = last_modified
                    tile.size = size
                    tile.product = product
                    tile.date_image = date_image
                    tile.save()

                 # Set the poly field using the bounding box
                t1 = time.time()
                url = f'/vsis3/{bucket_name}/{obj["Key"]}'
                ds = gdal.Open(url)
                print(time.time()-t1)
                bounds = get_bounds(ds)
                poly = GEOSGeometry(bounds)#ogr.CreateGeometryFromWkt(bounds)
                tile.poly = poly

                tile.save()