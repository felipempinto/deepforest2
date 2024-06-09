from django.core.files import File
from django.db import connections
from django.conf import settings

import numpy as np

import pyproj
from shapely.ops import transform
from shapely.geometry import MultiPolygon,Polygon,shape,box
from osgeo import gdal, osr
import geopandas as gpd

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
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY', settings.AWS_SECRET_ACCESS_KEY)
gdal.SetConfigOption('AWS_REQUEST_PAYER', 'requester')

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

def get_bounds(ds):
    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    return xmin, ymin, xmax, ymax

def create_polygons(img,xsize,ysize,px_size,overlap=0.25):
    xsize *= px_size
    ysize *= px_size

    xmin, ymin, xmax, ymax = get_bounds(img)

    #TODO:
    # Desenvolver metodo para calcular overlap.
    n_x = (xmax-xmin)//xsize
    x_overlap = (((xmax-xmin)%xsize)/n_x)*px_size

    n_y = (ymax-ymin)//ysize
    y_overlap = (((ymax-ymin)%ysize)/n_y)*px_size

    stepx = xsize-x_overlap
    stepy = ysize-y_overlap

    polygons = []

    x_ar = np.arange(xmin,xmax,stepx)
    y_ar = np.arange(ymin,ymax,stepy)

    for i in range(len(x_ar)):
        for j in range(len(y_ar)):
            if x_ar[i]<=xmin:
                x_0 = xmin
                x_1 = x_0 + xsize
            else:
                x_0 = x_ar[i]-x_overlap
                x_1 = x_0+stepx+x_overlap

            if x_1>xmax:
                x_1 = xmax
                x_0 = x_1 - xsize

            if y_ar[j]<=ymin:
                y_0 = ymin
                y_1 = y_0 + ysize
            else:
                y_0 = y_ar[j] - y_overlap
                y_1 = y_0+ stepy + y_overlap

            if y_1 > ymax:
                y_1 = ymax
                y_0 = y_1 - ysize

            polygons.append(
                box(*[x_0,y_0,x_1,y_1])
                )

    return polygons

def cvt_title_to_s3name(title):
    s1 = title[39:41]
    s2 = title[41]
    s3 = title[42:44]
    s4 = title[11:15]
    s5 = int(title[15:17])
    s6 = int(title[17:19])
    return f's3://sentinel-s2-l2a/tiles/{s1}/{s2}/{s3}/{s4}/{s5}/{s6}/0/'

def create_chips(
        img_name,
        size,
        ):
    s3path = cvt_title_to_s3name(img_name)
    infile = s3path+"R10m/B02.jp2"
    img = infile.replace('s3://','/vsis3/')
    img_inp = gdal.Open(img)
    res = img_inp.GetGeoTransform()[1]
    proj = img_inp.GetProjection()
    polygons = create_polygons(img_inp,size,size,res)

    gdf = gpd.GeoDataFrame(
        geometry=polygons
        )
    gdf.set_crs(proj,inplace=True)
    gdf.to_crs(epsg=4326,inplace=True)
    return gdf



def process_local(arguments,mode):
    python = "/media/felipe/3dbf30eb-9bce-46d8-a833-ec990ba72625/Documentos/websites/deepforest_processlocal/venv/bin/python"
    code = "/media/felipe/3dbf30eb-9bce-46d8-a833-ec990ba72625/Documentos/websites/deepforest_processlocal/process_with_gdf.py"
    cmd = f'{python} {code} {arguments}'
    print(cmd)

    # os.system(cmd)
    import subprocess
 
    result = subprocess.check_output(cmd, shell=True, text=True)
    print(result)
    

def newrequest(data,request):
    # print(gdfs)
    # print(request)

    version = data["version"]
    product = data["product"]#request.pth.product.name.lower().replace(' ','')
    images = ",".join(data["images"])
    # pth = request.pth.get_pth()

    # config_file = request.pth.parameters.url
    user = request.user.username
    bounds = request.bounds.wkt
    
    date = request.created_at.strftime("%Y%m%dT%H%M%S")
    name = request.name

    print(version,product,user,date,name)
    mode = "data"
    request.response = {}
    output = f'requests/{user}/{product}/{version}/{date}/{name}.tif'
    try:
        arguments = f'-i {images} -b "{bounds}" -p "{product}" -v "{version}" -o "{output}" --no-tqdm'
        # process_output = process(
        #     arguments,
        #     mode,
        # )
        process_output = process_local(arguments,mode)
    except Exception as e:
        request.status="ERROR"        
        request.response["error"] = str(e)
        send_emails(request,"error",error=str(e))
    else:
        request.status = "DONE"
        request.mask = output
        mask = get_mask_by_url(output)
        request = create_visual(mask,request.mask,request)
        request.response["sucess"] = process_output
        send_emails(request,"sucess")

    request.name = os.path.basename(output).replace('.tif','')
    request.done = True
    
    # for conn in connections.all():
    #     if not conn.is_usable():
    #         conn.close()
    #         conn.connect()

    request.save()