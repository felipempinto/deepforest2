from django.contrib import admin
from django.urls import path,include
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='index.html')),    
    path('django-rq/', include('django_rq.urls')),
    path('api/main/',include('main.urls')),
    # path('',include('main.urls')),
    path('api/products/',include('products.urls')),
    path('api/users/',include('users.urls')),
    path("api/forestmask/",include('forestmask.urls')),
    # path('api-auth/', include('rest_framework.urls'))
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
