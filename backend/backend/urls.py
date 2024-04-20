from django.contrib import admin
from django.urls import path,include , re_path
from django.shortcuts import render
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from django.conf import settings
from django.conf.urls.static import static
from .urls_frontend import urls as urls_frontend

def render_react(request):
    return render(request, "index.html")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('django-rq/', include('django_rq.urls')),
    path('django-rq/', include('django_rq.urls')),
    path('api/main/',include('main.urls')),
    path('api/products/',include('products.urls')),
    path('api/users/',include('users.urls')),
    path("api/forestmask/",include('forestmask.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
] + \
urls_frontend 
# static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)



