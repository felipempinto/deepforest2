from django.urls import path
from . import views

urlpatterns = [
    path('models/', views.ModelsTrainedListCreateView.as_view(), name='models-list-create'),
    path('models/<int:pk>/', views.ModelsTrainedRetrieveUpdateDestroyView.as_view(), name='models-retrieve-update-destroy'),
    path('requests/', views.RequestProcessListCreateView.as_view(), name='requests-list-create'),
    path('requests/<int:pk>/', views.RequestProcessRetrieveUpdateDestroyView.as_view(), name='requests-retrieve-update-destroy'),
    path('requests/user/', views.RequestProcessUserListView.as_view(), name='requests-user-list'),  
    path('requests/delete/<int:pk>/', views.RequestProcessDeleteView.as_view(), name='request-delete'),
    path('geojsondata/', views.GeoJSONUploadView.as_view(), name='geojson-upload'),
]
