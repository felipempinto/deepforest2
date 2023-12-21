import pyproj
from shapely.ops import transform

def check_area(geom,metric='km2'):
    m = {
        'km2':1/1_000_000,
        'ha':1/10_000
        }
    prjin = pyproj.CRS.from_epsg(4326)
    prjout = pyproj.Proj(proj='aea',lat_1=geom.bounds[1],lat_2=geom.bounds[3]).crs
    project = pyproj.Transformer.from_crs(prjin, prjout, always_xy=True).transform
    geom_aea = transform(project, geom)
    area = geom_aea.area
    if metric in m:
        area = area*m[metric]
    return area