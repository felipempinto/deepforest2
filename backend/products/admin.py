from django.contrib import admin
from .models import *#ModelsTrained,RequestBounds#RequestProcess#,RequestVisualization
# Register your models here.


admin.site.register(ModelsTrained)
admin.site.register(RequestBounds)
admin.site.register(RequestsHistoric)
# admin.site.register(RequestProcess)
# admin.site.register(RequestVisualization)
