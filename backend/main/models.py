from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=50)
    image = models.ImageField(upload_to='products/')
    url = models.CharField(max_length=200)

    def __str__(self):
        return self.name


