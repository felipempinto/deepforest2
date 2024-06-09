from django.urls import path
from . import views

app_name = 'forestmask'

urlpatterns = [
    path('',views.ForestMaskAPIView.as_view(), name='forestmask'),
    path('images-location/',views.ImagesLocationAPIView.as_view(), name='images-location'),
    
    # path('new/',views.new_request,name='new'),
    # path('my_masks/',views.user_requests,name='my_masks'),
    # path("processed-s2/",views.get_s2_processed,name='processed-s2')
]
