# from django.db import models
from django.contrib.gis.db import models
from django.conf import settings
from osgeo import gdal
from django.contrib.gis.geos import GEOSGeometry
from shapely.geometry import MultiPolygon,Polygon
from shapely.ops import transform
import pyproj


gdal.SetConfigOption('AWS_REGION', 'us-east-2')
gdal.SetConfigOption('AWS_ACCESS_KEY_ID', settings.AWS_ACCESS_KEY_ID)
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY',settings.AWS_SECRET_ACCESS_KEY)
    
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