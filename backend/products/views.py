from rest_framework import generics,status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ModelsTrained, RequestProcess
from .serializers import ModelsTrainedSerializer, RequestProcessSerializer,GeoJSONSerializer

class ModelsTrainedListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class ModelsTrainedRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class RequestProcessListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = RequestProcess.objects.all()
    serializer_class = RequestProcessSerializer

class RequestProcessRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
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