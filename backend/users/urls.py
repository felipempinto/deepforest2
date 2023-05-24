from django.urls import path, include
from rest_framework import routers
from . import views

urlpatterns = [
    # path('', include(router.urls)),
    path('register/', views.RegisterView.as_view()),
    path('me/', views.RetrieveUserView.as_view()),
    # path('update/', views.UserUpdateView.as_view(), name='user_update'),
    path('update/', views.UserUpdateView.as_view()),
    path('delete/<int:pk>/', views.UserDeleteView.as_view(), name='user-delete'),
]