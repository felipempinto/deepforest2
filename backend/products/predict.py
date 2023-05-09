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
from tqdm import tqdm
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

def get_bounds(ds):
    if isinstance(ds,str):
        ds = gdal.Open(ds)

    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    return (xmin,ymin,xmax,ymax)

def normalize(array):
    array[np.isnan(array)] = 0
    array = (array.max()-array)/(array.max()-array.min())
    return np.array(array,dtype=np.float32)


def get_net(name,pth,dev,in_channels=4,classes=2,encoder='resnet101'):
    if name=='forestmask':
        net = smp.Unet(
            in_channels=in_channels,
            classes=classes,
            encoder_name=encoder
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
    
    array = img_inp.ReadAsArray()
    (b,g,_,n) = array
    array = np.array([b,g,n])
    input_bands = array.shape[0]

    net = get_net(processing_name,pth,dev,in_channels=input_bands)

    output_array = np.zeros(array.shape[1:])
    x = 0
    y = 0
    xs = array.shape[1]
    ys = array.shape[2]
    overlap = int(size/(2**6))

    total = 0
    while x < xs:
        while y < ys:
            y += (size - overlap)
            total+=1
        x += (size - overlap)
        y = 0

    x = 0
    y = 0

    pred = True
    
    pbar = tqdm(total=total)
    with torch.no_grad():
        while x < xs:
            while y < ys:
                
                x1,x2 = (x, x + size) if x + size < xs else (xs - size, xs)
                y1,y2 = (y, y + size) if y + size < ys else (ys - size, ys)

                x_arr = array[:,x1:x2,y1:y2]
                
                if pred:
                    x_arr = normalize(x_arr)
                    x_arr = np.expand_dims(x_arr, 0)
                    x_arr = torch.from_numpy(x_arr).type(inputs_dtype).to(dev)

                    out = net(x_arr)
                    _, preds = torch.max(out, dim=1)
                    out = preds.cpu().detach().numpy()[0]
                    output_array[x1:x2,y1:y2] = out

                y += (size-overlap) 
                pbar.update(1)
            x += (size-overlap)
            y = 0

    local = f'temp/{output}'
    create_img(img_inp,output_array,local)

    # if verbose:
    # print("FILE SAVED AS: ",output)

    # output_s3 = f'{processing_name}/outputs/tiles/{filename}.tif'
    # s3.upload_file(output, AWS_STORAGE_BUCKET_NAME ,output)#output_s3)
    s3.upload_file(local, AWS_STORAGE_BUCKET_NAME ,output)#output_s3)
    
    ###################     PREPARING OUTPUT   ####################
    # geom = get_bounds(output)
    # proj = osr.SpatialReference(wkt=gdal.Open(output).GetProjection())
    # response = {
    #     'name':output,
    #     'bounds':geom,
    #     'epsg':proj.GetAttrValue('AUTHORITY',1)
    #     }
    
    # ###################     DELETE FILE    ##########################
    # os.remove(output)

    # return response

if __name__=="__main__":
    
    # img = '/vsis3/deepforestbucket/forestmask/inputs/S2A_MSIL2A_20200926T132241_N0214_R038_T22JEQ_20200926T172936.SAFE_1.tif'#''
    img = 'deepforestbucket/forestmask/inputs/20200822_22JEQ_compo_0008.tif'
    # img = sys.argv[1]
    print(classify(img))


