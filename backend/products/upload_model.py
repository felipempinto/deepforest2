from .models import ModelsTrained
from osgeo import gdal
import os


def submit(path):
    version = os.path.basename(path)
    description = ''
    product = models.ForeignKey
    pth = models.FileField
    poly = models.MultiPolygonField
    train_csv = models.FileField
    test_csv = models.FileField
    parameters = models.FileField