from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
from django.conf import settings
from django.template.defaultfilters import slugify

import pandas as pd

import json
from datetime import datetime

from users.models import User
from main.models import Product
from .utils import (get_upload_files,get_mask_by_url,read_text_file_from_s3,)


STATUS_CHOICES = (
    ("PROCESSING","Processing"),
    ("DONE","Done"),
    ("ERROR","Error"),
)

DATASOURCES= (
    ("DRONE","Drone"),
    ("AEROPHOTO","Aerophotogrametry"),
    ("SATELLITE","Satellite"),
)


BUCKET = settings.AWS_STORAGE_BUCKET_NAME


class TrainModel(models.Model):
    path = models.CharField(max_length=200)
    outpath = models.CharField(max_length=200)
    size = models.IntegerField(default=256)
    batch_size = models.IntegerField(default=10)
    learning_rate = models.FloatField(default=0.00001)
    epochs = models.IntegerField(default=200)
    workers = models.IntegerField(default=0)
    bands = models.IntegerField(default=3)
    classes = models.IntegerField(default=2)
    model = models.CharField(max_length=20,default='unet')
    encoder = models.CharField(max_length=50,default='resnet101')
    loss = models.CharField(max_length=50,default='dice')
    optimizer = models.CharField(max_length=50,default='adamw')


class ModelsTrained(models.Model):
    version = models.CharField(max_length=20)
    description = models.TextField(null=True,blank=True)
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    # pth = models.FileField(upload_to=get_upload_pth, null=True, blank=True)
    pth_path = models.CharField(max_length=200,null=True,blank=True)
    poly = models.MultiPolygonField(null=True, blank=True)
    train_csv = models.CharField(max_length=250,blank=True,null=True)
    test_csv = models.CharField(max_length=250,blank=True,null=True)
    parameters = models.CharField(max_length=250,blank=True,null=True)
    # train_csv = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    # test_csv = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    file_locations = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    # parameters = models.FileField(upload_to=get_upload_files, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    # def get_pth(self,expiration=1200):
    #     try:
    #         pth = self.pth.url
    #     except ValueError:
    #         try:
    #             response = s3_client.generate_presigned_url('get_object',
    #                                                     Params={'Bucket': BUCKET,
    #                                                             'Key': self.pth_path},
    #                                                     ExpiresIn=expiration)
    #         except (ClientError,ParamValidationError):
    #             return None
    #         else:
    #             return response
    #     # else:
    #     return pth
    
    def read_data(self):
        df_train = pd.read_csv(get_mask_by_url(self.train_csv))
        df_test = pd.read_csv(get_mask_by_url(self.test_csv))
        data = {
            "x":df_train["x"],
            "loss_train":df_train["loss"],
            "loss_test":df_train["loss"],
            "acc_train":df_test["acc"],
            "acc_test":df_test["acc"],
                }
        df = pd.DataFrame(data)
        return df.to_dict()

    def __str__(self):
        return f'{self.product.name} version {self.version}'

    def save(self):
        
        super(ModelsTrained, self).save()
        if self.poly is None:

            content = read_text_file_from_s3(self.file_locations.url)

            geoms = []
            for ft in content["features"]:
                geom_str = json.dumps(ft['geometry'])
                geom = GEOSGeometry(geom_str)
                geoms.append(geom)
            multi = MultiPolygon(geoms)
            self.poly = GEOSGeometry(multi)
            self.save()

# class RequestProcess(models.Model):
#     name = models.CharField(max_length=50,blank=True,null=True)
#     pth = models.ForeignKey(ModelsTrained,on_delete=models.CASCADE,blank=True,null=True)
#     mask = models.CharField(max_length=200,blank=True,null=True)
#     user = models.ForeignKey(User,on_delete=models.CASCADE)
#     done = models.BooleanField(default=False)
#     bounds = models.MultiPolygonField(null=True, blank=True)
#     status = models.CharField(max_length=10,choices=STATUS_CHOICES,default="PROCESSING")
#     date_requested = models.DateTimeField(default=datetime.now, blank=True)
#     response = models.JSONField(blank=True,null=True)
#     png = models.FileField(blank=True,null=True)
#     bounds_png = models.CharField(max_length=200,blank=True,null=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     def geojson(self):
#         return self.bounds.geojson

#     def save(self, *args, **kwargs):
#         for conn in connections.all():
#             if not conn.is_usable():
#                 conn.close()
#                 conn.connect()
#         super(RequestProcess,self).save(*args, **kwargs)
#         if not self.done:
#             job = django_rq.enqueue(requestprocess,args=(self,),timeout=99999)

#     def get_mask(self,expiration=1200):
#         mask = get_mask_by_url(self.mask,expiration=expiration)
#         return mask 

class RequestBounds(models.Model):
    name = models.CharField(max_length=50,blank=True,null=True)
    pth = models.ForeignKey(ModelsTrained,on_delete=models.CASCADE,blank=True,null=True)
    mask = models.CharField(max_length=200,blank=True,null=True)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    done = models.BooleanField(default=False)
    bounds = models.MultiPolygonField(null=True, blank=True)
    status = models.CharField(max_length=10,choices=STATUS_CHOICES,default="PROCESSING")
    response = models.JSONField(blank=True,null=True)
    png = models.FileField(blank=True,null=True)
    bounds_png = models.CharField(max_length=200,blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def geojson(self):
        return self.bounds.geojson

    def get_mask(self,expiration=1200):
        mask = get_mask_by_url(self.mask,expiration=expiration)
        return mask 
    

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = f"newrequest-{slugify(datetime.now().strftime('%Y%m%dT%H:%M:%S'))}"
        super(RequestBounds, self).save(*args, **kwargs)
# -d 20240508 -b "MULTIPOLYGON (((-51.564331 -27.431661, -51.784058 -27.655707, -51.586304 -27.830727, -51.333618 -27.60704, -51.564331 -27.431661)))" -p "https://s3.us-east-2.amazonaws.com/deepforestweb/static/models/Forest%20Mask/pth/net_JN05TTN.pth?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVHNKLCXSZQGFRLTK%2F20240525%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20240525T001029Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=05620ab3c94a14ec7f60d36c50344dbc0b46396d21445c9641c6562717fce739" -o "processed/felipe/forestmask/0.0.0/20240508/c6a828a89f574d6eaa6cabe32ce0d258.tif" -c "https://s3.us-east-2.amazonaws.com/deepforestweb/static/models/Forest%20Mask/files/commandline_args_XqKLX8W.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVHNKLCXSZQGFRLTK%2F20240525%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20240525T001029Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=6d803a7d75765cd45353eaa91ce2114665e7058eb57056b398d3f56a0665020c" -u forestmask --no-tqdm

#TODO: Count number of requests done by user and their dates,
# This will be good for pricing later

class Requests(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    requests = models.IntegerField()
    # date = ?
