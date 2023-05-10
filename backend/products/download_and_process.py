from sentinelsat import SentinelAPI
import pyproj
from shapely.ops import transform
from shapely.geometry import Polygon
from shapely.wkt import loads as shapely_loads
import pandas as pd
from osgeo import gdal,osr
from tqdm import tqdm

import datetime
import os
import time

from botocore.config import Config as Conf
import boto3
from botocore.exceptions import ClientError,ParamValidationError

from main.models import TilesProcessed
from .predict import classify

AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID_DEEPFOREST')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY_DEEPFOREST')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME_DEEPFOREST')

gdal.UseExceptions()
gdal.SetConfigOption("AWS_REQUEST_PAYER",'requester')
gdal.SetConfigOption('AWS_REGION', 'us-east-2')
gdal.SetConfigOption('AWS_ACCESS_KEY_ID', AWS_ACCESS_KEY_ID)
gdal.SetConfigOption('AWS_SECRET_ACCESS_KEY', AWS_SECRET_ACCESS_KEY)

user = os.environ.get("SENTINELSAT_LOGIN")
password = os.environ.get("SENTINELSAT_PASSWORD")


my_config = Conf(
        region_name = 'us-east-2',
        signature_version = 's3v4',
    )

s3 = boto3.client('s3',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                config=my_config,
                )

def get_images(d1, d2, bounds,cloud = 1.0,verbose=False):
    if verbose:
        print("#"*20,"SEARCHING IMAGES IN SENTINEL HUB")
    api = SentinelAPI(user, password, 'https://scihub.copernicus.eu/dhus')
    # (minx,miny,maxx,maxy) = bounds.split(',')
    # footprint = Polygon([[minx,maxy] , [maxx,maxy] , [maxx,miny] , [minx,miny]]).wkt
    footprint = bounds.wkt

    query_kwargs = {
            'area':footprint,
            'platformname': f'Sentinel-2',
            'date': (d1, d2),
            'cloudcoverpercentage': (0.0,cloud),
            'producttype': 'S2MSI2A',
            }
    if verbose:
        print(query_kwargs)
    products = api.query(**query_kwargs)
    gdf = api.to_geodataframe(products)
    return gdf

def cvt_title_to_s3name(title):

    s1 = title[39:41]
    s2 = title[41]
    s3 = title[42:44]
    s4 = title[11:15]
    s5 = int(title[15:17])
    s6 = int(title[17:19])

    return f's3://sentinel-s2-l2a/tiles/{s1}/{s2}/{s3}/{s4}/{s5}/{s6}/0/'

def get_dates(date):
    # print(date)
    # date = date.split('T')[0]
    date = datetime.datetime.strptime(date,'%Y%m%d')
    d1 = date - datetime.timedelta(days=180)
    d2 = date + datetime.timedelta(days=180)
    return d1,d2

def create_img(files,bands,output,dtype=gdal.GDT_Int16,verbose=False):
    img = gdal.Open(files[bands[0]])
    driver = gdal.GetDriverByName("GTiff")
    dst = driver.Create(output,img.RasterXSize,img.RasterYSize,len(bands),dtype)
    # for n,a in enumerate(ar,1):
    for n,i in enumerate(bands,1):
        t1 = time.time()
        a = gdal.Open(files[i]).ReadAsArray()
        if verbose:
            print(time.time()-t1, f'to read array {i}')
        dst.GetRasterBand(n).WriteArray(a)
    dst.SetProjection(img.GetProjection())
    dst.SetGeoTransform(img.GetGeoTransform())
    dst.FlushCache()

def nearest(items, pivot):
    return min(items, key=lambda x: abs(x - pivot))

def select_images(gdf,bounds,date,verbose=False):
    t1 = time.time()
    if verbose:
        print("$"*50)
        print("SELECTING IMAGES")
    
    date = datetime.datetime.strptime(date,'%Y%m%d')

    # (minx,miny,maxx,maxy) = bounds.split(',')
    # p = Polygon([[minx,maxy] , [maxx,maxy] , [maxx,miny] , [minx,miny]])
    
    contains = gdf[gdf.contains(bounds)]#p)]

    if len(contains)>0:
        near = nearest(contains['beginposition'], date)
        contains = contains[contains['beginposition']==near]
        # TODO:
        # Here you may have more than 1 image, so, maybe we can filter by the smaller size
        return contains.head(1)
    # print(gdf)
    gdf['tile'] = gdf.title.str[33:44]
    unique = pd.unique(gdf['tile'])

    names = []
    for u in unique:
        un = gdf[gdf['tile']==u]
        near = nearest(un['beginposition'], date)
        un = un[un['beginposition']==near]
        names.append(un['title'][un.index[0]])

    n = len(gdf)        
    gdf = gdf[gdf['title'].isin(names)] 
    if verbose:
        print('LEN BEFORE',n)
        print('LEN AFTER',len(gdf))
        print("TIME ON FUNCTION",time.time()-t1)

    # gdf.to_file("Intersects.geojson",driver="GeoJSON")
    return gdf

def reprojection(geom,epsg_out,epsg_in=4326):

    # prjin = pyproj.CRS(f'EPSG:{epsg_in}')
    prjin = pyproj.CRS.from_epsg(epsg_in)
    prjout = pyproj.CRS.from_epsg(epsg_out)#(f'EPSG:{epsg_out}')

    project = pyproj.Transformer.from_crs(prjin, prjout, always_xy=True).transform
    geom_out = transform(project, geom)
    return geom_out

def reproject_raster(raster,output='',verbose=False):
    target_sr = osr.SpatialReference()
    target_sr.ImportFromEPSG(4326)  
    name = f'{os.path.basename(raster).replace(".tif","")}-{int(time.time())}.tif'

    if output=='':
        output = f'/vsimem/REP_{name}'
    
    if verbose:
        print("Reprojecting...")
        t1 = time.time()
    gdal.Warp(output,raster,dstSRS=target_sr)
    if verbose:
        print("Reprojected in ",time.time()-t1,'seconds')
    
    return output

def mosaic(imgs,output):
    t1 = time.time()
    vrt = os.path.splitext(os.path.basename(output))[0]+'.vrt'
    gdal.BuildVRT(vrt, imgs,resampleAlg="cubic")
    gdal.Translate(output,vrt,format = "GTiff",resampleAlg="cubic")
    os.remove(vrt)
    print("TIME ON FUNCTION",time.time()-t1)

def download_from_df(file):
    print("DOWNLOAD FROM DF")
    t1 = time.time()
    # EXPECTED FORMAT:
    # s3://deepforestbucket/forestmask/outputs/testapi/sentinel2/S2A_MSIL2A_20220811T105631_N0400_R094_T30UYC_20220811T172058.tif

    bucket = file.split('/')[2]
    key = '/'.join(file.split('/')[3:])
    img_local = os.path.join('temp',key)
    if not os.path.exists(os.path.dirname(img_local)):
        os.makedirs(os.path.dirname(img_local))

    if not os.path.exists(img_local):
        s3.download_file(bucket,key, img_local)
    print("TIME ON FUNCTION",time.time()-t1)
    return img_local

def merge_rasters(rasters, out_file, clip_polygon,download=True,verbose=False):
    if verbose:
        print("MERGE RASTERS")

    rasters = [i.replace('s3:/','/vsis3') for i in rasters]
    
    r = []
    if download:
        if verbose:
            print("######### RASTERS TO MERGE: ")
            print(rasters)
        for raster in rasters:
            t1 = time.time()
            r.append(download_from_df(raster))
            if verbose:
                print("Time to download the raster: ",time.time()-t1,'seconds')
            
        rasters = r.copy()
        if verbose:
            print("RASTERS DOWNLOADED: ")
            print(rasters)

    if len(rasters)==1:
        if verbose:
            print("PARAMS FOR REP WITH 1 FILE:")
            print(rasters[0],clip_polygon,out_file)
        reproject_raster(rasters[0],out_file)
    else:
        rasters_processed = []
        for raster in rasters:
            out = reproject_raster(raster)
            rasters_processed.append(out)
        
        temp = f'temp/MERGE_{int(time.time())}.tif'
        mosaic(rasters_processed,temp)

        gdal.Warp(out_file,
                  temp,
                  outputBounds=clip_polygon,
                  resampleAlg='cubic',
                  format='GTiff')
        
        os.remove(temp)
    
    if verbose:
        print("TIME ON FUNCTION",time.time()-t1)

def download_file(title,s3path,download=True,verbose=False):
    if verbose:
        print("DOWNLOAD FILE")
    format_file = '.jp2'
    outpath = f'temp/dataset/sentinel2/{title}/'
    bands = ['B02','B03','B04','B08']
    arrays = {}
    for b in bands:
        infile = s3path+"R10m/" + b + format_file
        outfile = outpath + b + format_file

        if not download:
            if verbose:
                print('Not downloading!')
            outfile = infile.replace('s3://','/vsis3/')#'/vsis3_streaming/'
        else:
            if verbose:
                print("Downloading")
            t1 = time.time()
            cmd = f'aws s3 cp {infile} {outfile} --request-payer'
            if not os.path.exists(outfile):
                os.system(cmd)
            else:
                if verbose:
                    print(f"file {outfile} already exists")
                else:
                    pass
            if verbose:
                print(time.time()-t1,'seconds to download')
        arrays[b] = outfile
    
    output = os.path.join(outpath,'composition.tif')
    if not os.path.exists(output):
        create_img(arrays,bands,output)

    if verbose:
        print("TIME ON FUNCTION",time.time()-t1)
    return output

def get_data(date,bounds,verbose=False,product="forestmask"):
    if verbose:
        print("GET DATA")
        
    t1 = time.time()
    d1, d2 = get_dates(date)
    gdf = get_images(d1, d2, bounds,verbose=verbose)
    if len(gdf)==0:
        print("NO DATA IN THE GDF")
        return 
    titles = select_images(gdf,bounds,date,verbose=verbose)

    ready = []
    toprocess = []
    for title in titles['title']:
        if verbose:
            print(title)
        s3path = cvt_title_to_s3name(title)

        # title = 'S2B_MSIL2A_20220316T154909_N0400_R054_T18TXL_20220316T205909.tif'
        try:
            record = TilesProcessed.objects.get(name=title)
        except TilesProcessed.DoesNotExist:
            if verbose:
                print(f'File {title} will be downloaded')
            output = download_file(title,s3path)
            toprocess.append(output)
        else:
            if verbose:
                print(f'File {title} already exists for the product {product}')
            
            f = f's3://{AWS_STORAGE_BUCKET_NAME}/{record.location}'
            ready.append(f)


    if verbose:
        t2 = time.time()-t1
        print('Time to get the data: ',time.strftime('%H:%M:%S', time.gmtime(t2)))
        print("#"*50)
        print(ready,toprocess)
        print("#"*50)
    return (ready,toprocess)

def process(
            date_requested,
            bounding_box,
            pth,
            output,
            config_file,
            verbose=False,
            product='forestmask'
):
    bounding_box = shapely_loads(bounding_box)
    
    data = get_data(date_requested,bounding_box,verbose=verbose)
    if data is None:
        error_message = "Error with the request"
        print(error_message)
        return error_message
    (ready,toprocess) = data

    images = []+ready

    for file in (tqdm(toprocess) if verbose else toprocess):
        name = os.path.basename(os.path.dirname(file))
        output_path = f'{product}/outputs/api/{name[33:44]}/{name}.tif'
        if not os.path.exists(os.path.dirname(output_path)):
            os.makedirs(os.path.dirname(output_path))
        classify(file,output_path,pth,config_file)

        f = f's3://{AWS_STORAGE_BUCKET_NAME}/{output_path}'
        images.append(f)

        dt = os.path.basename(output_path)[11:26]
        dt = datetime.datetime.strptime(dt,'%Y%m%dT%H%M%S')

        name = os.path.basename(os.path.dirname(file))
        TilesProcessed.update_from_s3(product)

    if verbose:
        print(images, output, bounding_box.bounds)
    output_local = os.path.join('temp',output)
    if not os.path.exists(os.path.dirname(output_local)):
        os.makedirs(os.path.dirname(output_local))
    merge_rasters(images, output_local, bounding_box.bounds)

    if verbose:
        print(output_local, AWS_STORAGE_BUCKET_NAME ,output)
    s3.upload_file(output_local, AWS_STORAGE_BUCKET_NAME ,output)


def get_mask(key,expiration=1200):

    try:
        response = s3.generate_presigned_url('get_object',
                        Params={'Bucket': AWS_STORAGE_BUCKET_NAME,
                                'Key': key},
                        ExpiresIn=expiration)
    except (ClientError,ParamValidationError):
        return None
    else:
        return response