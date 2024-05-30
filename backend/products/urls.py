from rest_framework.routers import DefaultRouter
from django.urls import path,include
from . import views

router = DefaultRouter()
router.register('models-trained', views.ModelsTrainedDataViewSet, basename='models-trained')

urlpatterns = [
    path('', include(router.urls)),
    path('models/', views.ModelsTrainedListCreateView.as_view(), name='models-list-create'),
    # path('models/csv-data/', views.ModelsTrainedDataViewSet.as_view(), name='csv-data'),
    path('models/<int:pk>/', views.ModelsTrainedRetrieveUpdateDestroyView.as_view(), name='models-retrieve-update-destroy'),
    path('requests/', views.RequestProcessListCreateView.as_view(), name='requests-list-create'),
    path('requests/<int:pk>/', views.RequestProcessRetrieveUpdateDestroyView.as_view(), name='requests-retrieve-update-destroy'),
    path('requests/user/', views.RequestProcessUserListView.as_view(), name='requests-user-list'),  
    path('requests/delete/<int:pk>/', views.RequestProcessDeleteView.as_view(), name='request-delete'),
    path('geojsondata/', views.GeoJSONUploadView.as_view(), name='geojson-upload'),
    path('train/', views.TrainList.as_view(), name='train'),
    path('request-visualizations/', views.RequestVisualizationListCreateAPIView.as_view(), name='request-visualization-list-create'),
    path('request-visualizations/<int:pk>/', views.RequestVisualizationRetrieveUpdateDestroyAPIView.as_view(), name='request-visualization-retrieve-update-destroy'),
    path('get_data',views.GetData.as_view(),name="get_data")
]
