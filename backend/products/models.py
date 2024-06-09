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
    poly = models.MultiPolygonField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def get_path(self):
        return f"models/{self.product.name.lower().replace(' ','')}/{self.version}/"
    
    def read_data(self):
        df_train = pd.read_csv(get_mask_by_url(self.get_path()+"Train.csv"))
        df_test = pd.read_csv(get_mask_by_url(self.get_path()+"Test.csv"))
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
            url = self.get_path()+"locations.geojson"
            mask = get_mask_by_url(url)
            content = read_text_file_from_s3(mask)

            geoms = []
            for ft in content["features"]:
                geom_str = json.dumps(ft['geometry'])
                geom = GEOSGeometry(geom_str)
                geoms.append(geom)
            multi = MultiPolygon(geoms)
            self.poly = GEOSGeometry(multi)
            self.save()

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

# #TODO: Count number of requests done by user and their dates,
# # This will be good for pricing later
# class Requests(models.Model):
#     user = models.ForeignKey(User,on_delete=models.CASCADE)
#     requests = models.IntegerField()
#     # date = ?
