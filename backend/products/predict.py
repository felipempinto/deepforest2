import numpy as np
import torch
import segmentation_models_pytorch as smp
import time
from osgeo import gdal,osr
from smart_open import open as smart_open
import io
import os
import boto3
from tqdm import tqdm
import sys
import requests

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

def normalize(array):
    array[np.isnan(array)] = 0
    array = (array.max()-array)/(array.max()-array.min())
    return np.array(array,dtype=np.float32)


def get_net(model,pth,dev,in_channels=4,classes=2,encoder='resnet101'):
    if model=='unet':
        net = smp.Unet(
            in_channels=in_channels,
            classes=classes,
            encoder_name=encoder
        ).to(dev)
    net.load_state_dict(torch.load(pth,map_location='cpu'))

    return net

def read_json_file_from_s3(url):
    response = requests.get(url)
    response.raise_for_status()  # Check if the request was successful

    json_data = response.json()
    return json_data

def classify(
             img,
             output='',
             pth = '',
             config_file='',
             inputs_dtype = torch.float32,
             ):
    
    json_data = read_json_file_from_s3(config_file)
    size = json_data['size']
    processing_name = json_data['path'].split('/')[1]
    input_bands = json_data['bands']
    classes = json_data['classes']
    encoder = json_data['encoder']
    model = json_data['model']
    
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
    # filename = os.path.dirname(key)
    if bucket==AWS_STORAGE_BUCKET_NAME:
        s3.download_file(bucket,key, img_local)
    else:
        img_local = img

    ###################     READING IMG    ##########################
    img_inp = gdal.Open(img_local)    
    #TODO
    # Create the way to store which bands to use to create the composition and then, select the correct bands here
    array = img_inp.ReadAsArray()
    (b,g,_,n) = array
    array = np.array([b,g,n])
    input_bands = array.shape[0]

    net = get_net(
            model,
            pth,
            dev,
            in_channels=input_bands,
            classes=classes,
            encoder = encoder
            )

    output_array = np.zeros(array.shape[1:])
    x = 0
    y = 0
    xs = array.shape[1]
    ys = array.shape[2]
    overlap = int(size/4)

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
    if not os.path.exists(os.path.dirname(local)):
        os.makedirs(os.path.dirname(local))
    create_img(img_inp,output_array,local) 

    s3.upload_file(local, AWS_STORAGE_BUCKET_NAME ,output)#output_s3)
    
    # ###################     DELETE FILE    ##########################
    # os.remove(output)

if __name__=="__main__":
    
    # img = '/vsis3/deepforestbucket/forestmask/inputs/S2A_MSIL2A_20200926T132241_N0214_R038_T22JEQ_20200926T172936.SAFE_1.tif'#''
    img = 'deepforestbucket/forestmask/inputs/20200822_22JEQ_compo_0008.tif'
    # img = sys.argv[1]
    print(classify(img))


