from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render
from django.contrib.gis.db.models.functions import Union
from rest_framework import generics

from .serializers import ImagesLocationSerializer
from .models import ImagesLocation

class ImagesLocationAPIView(generics.ListAPIView):
    queryset = ImagesLocation.objects.all()
    serializer_class = ImagesLocationSerializer

class ForestMaskAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        #update_all_s2()

        locations = ImagesLocation.objects.all().aggregate(union=Union('poly'))
        locations = locations['union']
        zoom = 10
        if locations is not None:
            x,y = locations.centroid.x,locations.centroid.y
            geojson = locations.geojson
        else:
            x = -50.95458984374999
            y = -27.166695222253104
            geojson = '{"type": "FeatureCollection","features": [{"type": "Feature","properties": {},"geometry": {"type": "Point","coordinates": [-50.95458984374999,-27.166695222253104]}}]}'

        context = {   
            "geojson":geojson,
            "x":x,
            "y":y,
            "zoom":zoom,
        }

        if request.accepted_renderer.format == 'html':
            return render(request, 'forest_mask/forest_mask.html', context)
        else:
            return Response(context)