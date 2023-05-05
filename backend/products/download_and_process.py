from predict import classify

from sentinelsat import SentinelAPI
import pyproj
from shapely.ops import transform
from shapely.geometry import Polygon
import pyproj
import pandas as pd
from osgeo import gdal,osr
from tqdm import tqdm

import datetime
import os
import time

from botocore.config import Config as Conf
import boto3
from botocore.exceptions import ClientError,ParamValidationError

conf = Config()
eng = conf.SQLALCHEMY_DATABASE_URI
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

def get_bounds(im,projection=None,polygon=True):
    if projection is not None:
      src = gdal.Open(im)
      out = '/vsimem/temp.tif'
      gdal.Warp(out,src,dstSRS=projection)
      ds = gdal.Open(out)
    else:
      ds = gdal.Open(im)

    xmin, xpixel, _, ymax, _, ypixel = ds.GetGeoTransform()
    width, height = ds.RasterXSize, ds.RasterYSize
    xmax = xmin + width * xpixel
    ymin = ymax + height * ypixel
    if polygon:
        return Polygon([[xmin,ymax],[xmax,ymax],[xmax,ymin],[xmin,ymin]])
    else:
        return (xmin,ymin,xmax,ymax)

def get_images(d1, d2, bounds,cloud = 1.0,verbose=False):
    if verbose:
        print("#"*20,"SEARCHING IMAGES IN SENTINEL HUB")
    api = SentinelAPI(user, password, 'https://scihub.copernicus.eu/dhus')
    (minx,miny,maxx,maxy) = bounds.split(',')
    footprint = Polygon([[minx,maxy] , [maxx,maxy] , [maxx,miny] , [minx,miny]]).wkt

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
    date = datetime.datetime.strptime(date,'%Y-%m-%d')
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
    if verbose:
        print("$"*50)
        print("SELECTING IMAGES")
    
    date = datetime.datetime.strptime(date,'%Y-%m-%d')

    (minx,miny,maxx,maxy) = bounds.split(',')
    p = Polygon([[minx,maxy] , [maxx,maxy] , [maxx,miny] , [minx,miny]])
    
    contains = gdf[gdf.contains(p)]

    if len(contains)>0:
        near = nearest(contains['beginposition'], date)
        contains = contains[contains['beginposition']==near]
        # TODO:
        # Here you may have more than 1 image, so, maybe we can filter by the smaller size
        return contains.head(1)
    
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

    gdf.to_file("Intersects.geojson",driver="GeoJSON")
    return gdf

def save_to_db(name,product,date,geom):
    existing_obj = ProcessedSentinel.query.filter_by(
        name=name, 
        product=product
        ).first()
    
    if existing_obj is None:
        # geom = "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))"
        new_geom = func.ST_GeomFromText(geom , 4326)

        new_processed_sentinel = ProcessedSentinel(
            name=name,
            product=product,
            date=date,
            geom=new_geom
        )

        new_processed_sentinel.save()

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
    vrt = os.path.splitext(os.path.basename(output))[0]+'.vrt'
    gdal.BuildVRT(vrt, imgs,resampleAlg="cubic")
    gdal.Translate(output,vrt,format = "GTiff",resampleAlg="cubic")
    os.remove(vrt)

def download_from_df(file):
    # EXPECTED FORMAT:
    # s3://deepforestbucket/forestmask/outputs/testapi/sentinel2/S2A_MSIL2A_20220811T105631_N0400_R094_T30UYC_20220811T172058.tif

    s3 = boto3.client('s3',
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY
                  )

    bucket = file.split('/')[2]
    key = '/'.join(file.split('/')[3:])
    img_local = os.path.join('temp',key)
    if not os.path.exists(os.path.dirname(img_local)):
        os.makedirs(os.path.dirname(img_local))

    if not os.path.exists(img_local):
        s3.download_file(bucket,key, img_local)

    return img_local

def merge_rasters(rasters, out_file, clip_polygon,download=True,verbose=False):

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

def download_file(title,s3path,download=True,verbose=False):
    format_file = '.jp2'
    outpath = f'dataset/sentinel2/{title}/'
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
    return output

def get_data(date,bounds,verbose=False,product="forestmask"):
    t1 = time.time()
    d1, d2 = get_dates(date)
    gdf = get_images(d1, d2, bounds,verbose=verbose)
    titles = select_images(gdf,bounds,date,verbose=verbose)

    ready = []
    toprocess = []
    for title in titles['title']:
        if verbose:
            print(title)
        s3path = cvt_title_to_s3name(title)

        engine = create_engine(eng)
        Session = sessionmaker(bind=engine)

        with Session() as session:
            if verbose:
                print(f"Searching for: name={title}, product={product}")
            record = session.query(ProcessedSentinel).filter_by(name=title, 
                                                                product=product
                                                                ).first()
            if verbose:
                print(record)

        if record:
            if verbose:
                print(f'File {title} already exists for the product {product}')
            
            f = f's3://{AWS_STORAGE_BUCKET_NAME}/{record.path}'
            ready.append(f)
        else:
            if verbose:
                print(f'File {title} will be downloaded')
            output = download_file(title,s3path)
            toprocess.append(output)


    if verbose:
        t2 = time.time()-t1
        print('Time to get the data: ',time.strftime('%H:%M:%S', time.gmtime(t2)))
        print("#"*50)
        print(ready,toprocess)
        print("#"*50)
    return ready,toprocess


def check_area(bounding_box):
    bb = tuple([float(i) for i in bounding_box.split(",")])
    (xmin, ymin, xmax, ymax) = bb
    geom = Polygon([[xmin,ymax],[xmax,ymax],[xmax,ymin],[xmin,ymin]])

    prjin = pyproj.CRS.from_epsg(4326)
    prjout = pyproj.Proj(proj='aea',lat_1=geom.bounds[1],lat_2=geom.bounds[3]).crs
    project = pyproj.Transformer.from_crs(prjin, prjout, always_xy=True).transform
    geom_aea = transform(project, geom)
    return geom_aea.area

def process(date_requested,
            bounding_box,
            pth,
            output,
            processing_request,
            verbose=False,
            product='forestmask'
            ):
    
    bb = tuple([float(i) for i in bounding_box.split(",")])
    
    s3 = boto3.client('s3',
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY
                  )

    ready,toprocess = get_data(date_requested,bounding_box,verbose=verbose)

    images = []+ready

    engine = create_engine(eng)
    Session = sessionmaker(bind=engine)

    for file in (tqdm(toprocess) if verbose else toprocess):
        name = os.path.basename(os.path.dirname(file))
        output_path = f'{product}/outputs/api/{name[33:44]}/{name}.tif'
        if not os.path.exists(os.path.dirname(output_path)):
            os.makedirs(os.path.dirname(output_path))
        clf_out = classify(file,output_path,pth)
        
        p = clf_out['name']
        img_geom = clf_out['bounds']
        epsg = clf_out['epsg']

        f = f's3://{AWS_STORAGE_BUCKET_NAME}/{p}'
        images.append(f)

        dt = os.path.basename(p)[11:26]
        dt = datetime.datetime.strptime(dt,'%Y%m%dT%H%M%S')

        (xmin, ymin, xmax, ymax) = img_geom
        img_geom = Polygon([[xmin,ymax],[xmax,ymax],[xmax,ymin],[xmin,ymin]])
        geom = reprojection(img_geom,4326,int(epsg))

        name = os.path.basename(os.path.dirname(file))
        with Session() as session:
            record = ProcessedSentinel(name=name, 
                                       product=product,
                                       path=p,
                                       date=dt,
                                       geom=geom.wkt
                                       )
            session.add(record)
            session.commit()
    
    if verbose:
        print(images, output, bb)
    output_local = os.path.join('temp',output)
    if not os.path.exists(os.path.dirname(output_local)):
        os.makedirs(os.path.dirname(output_local))
    merge_rasters(images, output_local, bb)

    if verbose:
        print(output_local, AWS_STORAGE_BUCKET_NAME ,output)
    s3.upload_file(output_local, AWS_STORAGE_BUCKET_NAME ,output)
    # shutil.rmtree('temp')

    with Session() as session:
        processing_request.status = 'done'
        processing_request.path = output
        session.add(processing_request)
        session.commit()


def get_mask(key,expiration=1200):
    my_config = Conf(
        region_name = 'us-east-2',
        signature_version = 's3v4',
    )

    s3_client = boto3.client('s3',
                            aws_access_key_id=AWS_ACCESS_KEY_ID,
                            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                            config=my_config,
                            )
    try:
        response = s3_client.generate_presigned_url('get_object',
                        Params={'Bucket': AWS_STORAGE_BUCKET_NAME,
                                'Key': key},
                        ExpiresIn=expiration)
    except (ClientError,ParamValidationError):
        return None
    else:
        return response