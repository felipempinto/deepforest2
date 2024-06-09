from django.contrib import admin
from .models import Product,TilesProcessed,TilesDownloaded
# Register your models here.
admin.site.register(Product)
admin.site.register(TilesProcessed)
admin.site.register(TilesDownloaded)