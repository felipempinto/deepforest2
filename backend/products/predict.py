import numpy as np
import torch
import segmentation_models_pytorch as smp
import uuid
import time
from osgeo import gdal,osr
from smart_open import open as smart_open
import io
import os
import boto3
# from tqdm import tqdm
import sys


class InvalidNumberBandsException(Exception):
    "Raised if the number of bands is different from the accepted"
    pass

gdal.UseExceptions()

AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID_DEEPFOREST')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY_DEEPFOREST')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME_DEEPFOREST')

gdal.SetConfigOption('AWS_REGION', 'us-east-2')
gdal.SetConfigOption('AWS_ACCESS_KEY_ID', AWS_ACCESS_KEY_ID)
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY', AWS_SECRET_ACCESS_KEY)

s3 = boto3.client('s3',
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY
                  )


dev = torch.device("cpu")

def clip_img(output,inp_file,prj,xRes,yRes,extent,nodata=None):
    gdal.Warp(output,
                inp_file,
                dstSRS=prj,
                xRes=xRes,
                yRes=yRes,
                outputBounds=extent,
                srcNodata = nodata,
                resampleAlg='cubic',
                format='GTiff')

def get_bounds(ds):
    if isinstance(ds,str):
        ds = gdal.Open(ds)

    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    return (xmin,ymin,xmax,ymax)
    

def create_polygons(img,xsize,ysize):
    xmin, ymin, xmax, ymax = get_bounds(img)
    x_ar = np.arange(xmin,xmax+xsize,xsize)
    y_ar = np.arange(ymin,ymax+ysize,ysize)
    polygons = []
    for i in range(len(x_ar)-1):
        for j in range(len(y_ar)-1):
            polygons.append(
                [x_ar[i], y_ar[j], x_ar[i+1], y_ar[j+1]]
            )
    return polygons

####################################################################################
#########################   Classify pieces   ######################################

def create_img(img,array,output,dtype=gdal.GDT_Byte):
    driver = gdal.GetDriverByName("GTiff")
    dst = driver.Create(output,img.RasterXSize,img.RasterYSize,1,dtype)
    b = dst.GetRasterBand(1)
    b.SetNoDataValue(0)
    b.WriteArray(array)
    dst.SetProjection(img.GetProjection())
    dst.SetGeoTransform(img.GetGeoTransform())
    dst.FlushCache()


def normalize(array):
    array[np.isnan(array)] = 0
    array = (array.max()-array)/(array.max()-array.min())
    return np.array(array,dtype=np.float32)


def get_net(name,pth,dev,in_channels=4,classes=2):
    if name=='forestmask':
        net = smp.Unet(
            in_channels=in_channels,
            classes=classes,
        ).to(dev)
    
    net.load_state_dict(torch.load(pth,map_location='cpu'))

    return net



def classify(
             img,
             output='',
             pth = '',
             n_of_bands=4,
             n_of_classes=2,
             inputs_dtype = torch.float32,
             size = 256,
             processing_name='forestmask'
             ):
    
    ###################     READING PTH    ##########################
    if pth=='':
        pth = f's3://deepforestbucket/{processing_name}/models_pth/net.pth'

    with smart_open(pth, mode='rb', transport_params={'client': s3}) as f:
        pth = io.BytesIO(f.read())

    ###################     PREPARING DIRS    ######################
    temp_dir = 'temp'
    if not os.path.exists(temp_dir):
        os.mkdir(temp_dir)

    if output=='':
        output = os.path.join(temp_dir,os.path.basename(img))
    img_local = os.path.join(temp_dir,os.path.basename(img))

    ################     DOWNLOADING FILES    #####################
    s = img.split('/')
    bucket = s[0]
    key = '/'.join(s[1:])
    filename = os.path.dirname(key)
    if bucket==AWS_STORAGE_BUCKET_NAME:
        s3.download_file(bucket,key, img_local)
    else:
        img_local = img

    ###################     READING IMG    ##########################
    img_inp = gdal.Open(img_local)
    n_bands = img_inp.RasterCount
    if n_bands!=n_of_bands:
        raise InvalidNumberBandsException(f"Input file have {n_bands} bands, while it was expected {n_of_bands} bands")

    ###################     PREPARING CHIPS    #####################
    res = img_inp.GetGeoTransform()[1]
    proj = img_inp.GetProjection()
    polygons = create_polygons(img_inp,size*res,size*res)
    files = []
    for n,p in enumerate(polygons,1):
        name = f'/vsimem/{uuid.uuid4().hex.upper()}_{time.time()}_{str(n).zfill(10)}.tif'
        clip_img(name,img_inp,proj,res,res,p)
        files.append(name)

    net = get_net(processing_name,pth,dev)

    ###################     PREDICTING    ##########################    
    files_class = []
    with torch.no_grad():
        # for im in tqdm(files):
        for im in files:
            img = gdal.Open(im)
            output_class = f'/vsimem/classified_{os.path.basename(im)}'

            x = img.ReadAsArray()
            x = normalize(x)
            x = np.expand_dims(x, 0)
            x = torch.from_numpy(x).type(inputs_dtype).to(dev)

            out = net(x)
            _, preds = torch.max(out, dim=1)
            out = preds.cpu().detach().numpy()[0]

            create_img(img,out,output_class)
            files_class.append(output_class)

    ###################     JOIN ALL    ##########################
    gdal.Warp(output,
              files_class,
              format="GTiff",
              options=["COMPRESS=LZW", "TILED=YES"])

    output_s3 = f'{processing_name}/outputs/tiles/{filename}.tif'
    s3.upload_file(output, AWS_STORAGE_BUCKET_NAME ,output_s3)
    
    ###################     PREPARING OUTPUT   ####################
    geom = get_bounds(output)
    proj = osr.SpatialReference(wkt=gdal.Open(output).GetProjection())
    response = {
        'name':output_s3,
        'bounds':geom,
        'epsg':proj.GetAttrValue('AUTHORITY',1)
        }
    
    ###################     DELETE FILE    ##########################
    os.remove(output)

    return response

if __name__=="__main__":
    
    # img = '/vsis3/deepforestbucket/forestmask/inputs/S2A_MSIL2A_20200926T132241_N0214_R038_T22JEQ_20200926T172936.SAFE_1.tif'#''
    img = 'deepforestbucket/forestmask/inputs/20200822_22JEQ_compo_0008.tif'
    # img = sys.argv[1]
    print(classify(img))


