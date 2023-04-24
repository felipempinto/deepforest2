from django.urls import path, include
from rest_framework import routers
from .views import RegisterView,RetrieveUserView#UserDetailView

urlpatterns = [
    # path('', include(router.urls)),
    path('register/', RegisterView.as_view()),
    path('me/', RetrieveUserView.as_view()),
]