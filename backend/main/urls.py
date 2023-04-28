from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView,TokenVerifyView
from . import views

urlpatterns = [
    path('', views.ProductList.as_view(), name='home'),
    path('api/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    # path('api/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    # path('api/token/verify/', views.CustomTokenVerifyView.as_view(), name='token_verify'),
    path('api/tiles/', views.tiles_list, name='tiles_list'),
    path('api/tiles/download/<int:tile_id>/', views.DownloadTileView.as_view(), name='download_tile'),
    path('api/tiles/update/', views.tiles_update, name='tiles_update'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)