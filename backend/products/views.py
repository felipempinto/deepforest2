from rest_framework import generics,status,viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

import pandas as pd

from .models import ModelsTrained, RequestProcess
from .serializers import *

class RequestVisualizationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = RequestVisualizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RequestVisualization.objects.filter(request__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(request__user=self.request.user)

class RequestVisualizationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RequestVisualizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RequestVisualization.objects.filter(request__user=self.request.user)

class TrainList(APIView):
    def get(self, request):
        train = TrainModel.objects.all()
        print(train)
        serializer = TrainDatasetSerializer(train, many=True)
        return Response(serializer.data)

class ModelsTrainedListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class ModelsTrainedDataViewSet(viewsets.ModelViewSet):
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedDataSerializer

class ModelsTrainedRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class RequestProcessListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = RequestProcess.objects.all()
    serializer_class = RequestProcessSerializer

from rest_framework import permissions

class IsProcessingUser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        print("ADMIN",request.user.username)
        permission = request.user.username == "admin"
        return permission

class RequestProcessRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,IsProcessingUser]
    queryset = RequestProcess.objects.all()
    serializer_class = RequestProcessSerializer

class RequestProcessUserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RequestProcessSerializer

    # def get_queryset(self):
    #     user_id = self.request.user.id
    #     queryset = RequestProcess.objects.filter(user_id=user_id)
    #     return queryset
    
    def get_queryset(self):
        user_id = self.request.user.id
        queryset = RequestProcess.objects.filter(user_id=user_id).order_by('-created_at')
        return queryset


class GeoJSONUploadView(APIView):
    def post(self, request, format=None):
        serializer = GeoJSONSerializer(data=request.data)
        
        if serializer.is_valid():
            geojsonData = serializer.validated_data['geojsonData']
            print(geojsonData)

            return Response({'status': 'success'}, status=200)
        else:
            return Response(serializer.errors, status=400)
        

class RequestProcessDeleteView(APIView):
    def delete(self, request, pk):
        try:
            request_process = RequestProcess.objects.get(pk=pk)
            request_process.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RequestProcess.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)