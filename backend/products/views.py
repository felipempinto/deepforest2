from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ModelsTrained, RequestProcess
from .serializers import ModelsTrainedSerializer, RequestProcessSerializer

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
