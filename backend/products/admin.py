from django.contrib import admin
from .models import ModelsTrained,RequestProcess,RequestVisualization
# Register your models here.


admin.site.register(ModelsTrained)
admin.site.register(RequestProcess)
admin.site.register(RequestVisualization)
