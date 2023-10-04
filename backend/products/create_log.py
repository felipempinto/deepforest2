import pyproj
from osgeo import gdal
from shapely.geometry import MultiPolygon,Polygon
from shapely.ops import transform
import sys

def get_bounds(ds):
    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    poly = Polygon(
            [
                [xmin,ymax],
                [xmax,ymax],
                [xmax,ymin],
                [xmin,ymin]
            ]
        )

    wgs84 = pyproj.CRS('EPSG:4326')
    utm = ds.GetProjection()

    project = pyproj.Transformer.from_crs(utm, wgs84,  always_xy=True).transform
    poly = transform(project, poly)
    return poly

def create_log(files,out):
    polys = []
    with open(files) as f:
        for file in f:
            ds = gdal.Open(file.replace('\n',''))
            bounds = get_bounds(ds)
            polys.append(bounds)
    
    multi = MultiPolygon(polys)
    with open(out,mode='w') as f:
        f.write(multi.wkt)


if __name__=="__main__":
    file = sys.argv[1]
    out = sys.argv[2]

    create_log(file,out)