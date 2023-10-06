from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView,TokenVerifyView
# from django.views.generic import TemplateView
from . import views

urlpatterns = [
    path('', views.ProductList.as_view(), name='home'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('tiles/', views.tiles_list, name='tiles_list'),
    path('tiles/download/<int:tile_id>/', views.DownloadTileView.as_view(), name='download_tile'),
    path('tiles/update/', views.tiles_update, name='tiles_update'),
    #GAMBIARRA
    path('update_tiles_from_s3/', views.UpdateTilesFromS3.as_view(), name='update_tiles_from_s3'), 
    path('tiles/<str:name>/', views.RetrieveTile.as_view(), name='retrieve_tile_by_name'),

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)