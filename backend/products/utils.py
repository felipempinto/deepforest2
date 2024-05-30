from django.core.files import File
from django.db import connections
from django.conf import settings

import numpy as np

import pyproj
from shapely.ops import transform
from shapely.geometry import MultiPolygon,Polygon,shape
from osgeo import gdal, osr


from botocore.exceptions import ClientError,ParamValidationError
from botocore.config import Config
import boto3

from PIL import Image

import io
import uuid
import os
import requests

from .processing import process,send_emails

gdal.SetConfigOption('AWS_REGION', 'us-east-2')
gdal.SetConfigOption('AWS_ACCESS_KEY_ID', settings.AWS_ACCESS_KEY_ID)
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY',settings.AWS_SECRET_ACCESS_KEY)


BUCKET = settings.AWS_STORAGE_BUCKET_NAME
EMAIL_HOST_USER  = settings.EMAIL_HOST_USER 

my_config = Config(
    region_name = settings.AWS_S3_REGION_NAME,
    signature_version = 's3v4',
)

s3_client = boto3.client('s3',
                         aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                         aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                         config=my_config,
                         )

def read_text_file_from_s3(url):
    
    response = requests.get(url)
    response.raise_for_status()  # Check if the request was successful

    file_contents = response.json()
    return file_contents

def get_upload_pth(instance, filename):
    return f"models/{instance.product}/pth/{filename}"

def get_upload_files(instance, filename):
    return f"models/{instance.product}/files/{filename}"

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

def convert_color(img_array):
    if np.max(img_array) > 1:
        img_array /= np.max(img_array)

    unique_values = np.unique(img_array)
    if len(unique_values) > 2 or (0 in unique_values and 1 not in unique_values):
        color_map = {
            0: (0, 0, 0),  
            1: (0, 255, 0),  
            2: (0, 0, 255),  
            3: (255, 255, 0),
            4: (255, 0, 255) 
        }
    else:
        color_map = {
            0: (0, 0, 0, 0),  
            1: (0, 255, 0, 255)
        }

    rgb_image = np.zeros((*img_array.shape, 3 if len(color_map[0]) == 3 else 4), dtype=np.uint8)
    for val, color in color_map.items():
        rgb_image[img_array == val] = color
    return rgb_image



def create_visual(im,name,self):
    img = gdal.Open(im)
    ar = img.ReadAsArray()

    ar = convert_color(ar)

    bounds = get_bounds(img)
    im1 = Image.fromarray(ar)
    with io.BytesIO() as buffer:
        im1.save(buffer, format='PNG')
        image_data = buffer.getvalue()
    filename = name.replace('.tif', '.png')

    self.bounds_png = ','.join([str(i) for i in bounds])
    self.png.save(filename, File(io.BytesIO(image_data)))

    return self



def requestprocess(self):
    v = self.pth.version
    product = self.pth.product.name.lower().replace(' ','')
    pth = self.pth.get_pth()

    config_file = self.pth.parameters.url
    user = self.user.username
    date = self.date_requested.strftime("%Y%m%d")
    unique_id = uuid.uuid4().hex

    self.response = {}
    output = f'processed/{user}/{product}/{v}/{date}/{unique_id}.tif'
    # output = "processed/felipe/forestmask/0.0.0/20240506/3c5664aeb11b40b8904b99809f4caab3.tif"
    try:
        # process_output = ""
        process_output = process(
            date,
            self.bounds.wkt,
            pth,
            output,
            config_file,
            product=product,
        )
    except Exception as e:
        self.status="ERROR"        
        self.response["error"] = str(e)
        send_emails(self,"error",error=str(e))
    else:
        self.status = "DONE"
        self.mask = output
        mask = get_mask_by_url(output)
        self = create_visual(mask,self.mask,self)
        self.response["sucess"] = process_output
        send_emails(self,"sucess")

    self.name = os.path.basename(output).replace('.tif','')
    self.done = True
    
    for conn in connections.all():
        if not conn.is_usable():
            conn.close()
            conn.connect()

    self.save()
    # send_emails(self,tp)# self.user,EMAIL_HOST_USER,date,tp=tp,e=error_message,users=["admin","user"],processtime = process_time)
    # TilesProcessed.update_from_s3(product)
            
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


STATUS_CHOICES = (
    ("PROCESSING","Processing"),
    ("DONE","Done"),
    ("ERROR","Error"),
)