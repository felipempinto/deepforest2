from rest_framework import generics,status,viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

import requests

from shapely.geometry import Polygon
from shapely.wkt import dumps as shapely_to_wkt
from shapely.wkt import loads as shapely_loads
import pandas as pd
import geopandas as gpd

import django_rq

from users.models import User
from .utils import create_chips,newrequest
from .models import ModelsTrained, RequestBounds#RequestProcess
from .serializers import *

class RequestVisualizationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = VisualRequestProcessSerializer#RequestVisualizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # return RequestVisualization.objects.filter(request__user=self.request.user)
        # return RequestProcess.objects.filter(request__user=self.request.user)
        return RequestBounds.objects.filter(request__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(request__user=self.request.user)

class RequestVisualizationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VisualRequestProcessSerializer#RequestVisualizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # return RequestVisualization.objects.filter(request__user=self.request.user)
        # return RequestProcess.objects.filter(request__user=self.request.user)
        return RequestBounds.objects.filter(request__user=self.request.user)

class TrainList(APIView):
    def get(self, request):
        train = TrainModel.objects.all()
        serializer = TrainDatasetSerializer(train, many=True)
        return Response(serializer.data)

class ModelsTrainedListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class ModelsTrainedDataViewSet(viewsets.ModelViewSet):
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer#ModelsTrainedDataSerializer

class ModelsTrainedRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class RequestProcessListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    # queryset = RequestProcess.objects.all()
    queryset = RequestBounds.objects.all()
    serializer_class = RequestProcessSerializer

class NewRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pth = request.data.get('pth')
        bounds = request.data.get('bounds')
        files = request.data.get('files')

        request_data = {
            'pth': pth,
            'bounds': bounds,
            'user': request.user.id,
            "response":{"files":files},
        }
        request_serializer = RequestProcessSerializer(
            data=request_data, 
            context={'request':request}
            )

        try:
            pth_instance = ModelsTrained.objects.get(id=pth)
        except ModelsTrained.DoesNotExist:
            return Response({'error': 'Invalid pth ID'}, status=status.HTTP_400_BAD_REQUEST)

        # gdfs = {}
        # for file in files:
        #     gdf = create_chips(file,size=256)
        #     # gdf["data"] = [file]*len(gdf)    
        #     gdfs[file] = gdf.to_json()
        # product = request_serializer.pth.product
        # version = request_serializer.pth.version

        # data = {
        #     "bounds":bounds,
        #     "product":product,
        #     "version":version,

        #     }
        if request_serializer.is_valid():
            request_instance = request_serializer.save()
            product = pth_instance.product.name
            version = pth_instance.version
            data = {
                "bounds": bounds,
                "product": product,
                "version": version,
                "images": files,
            }
            job = django_rq.enqueue(
                newrequest,
                args=(data,request_instance)
                )
            return Response(
                {'message': 'Request created successfully', 
                 'request_id': request_instance.id}, 
                 status=status.HTTP_201_CREATED)
        else:
            return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IsProcessingUser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        permission = request.user.username == "admin"
        return permission

class RequestProcessRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,IsProcessingUser]
    # queryset = RequestProcess.objects.all()
    queryset = RequestBounds.objects.all()
    serializer_class = RequestProcessSerializer

class RequestProcessUserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RequestProcessSerializer

    def get_queryset(self):
        user_id = self.request.user.id
        # queryset = RequestProcess.objects.filter(user_id=user_id).order_by('-created_at')
        queryset = RequestBounds.objects.filter(user_id=user_id).order_by('-created_at')
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
            # request_process = RequestProcess.objects.get(pk=pk)
            request_process = RequestBounds.objects.get(pk=pk)
            request_process.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        # except RequestProcess.DoesNotExist:
        except RequestBounds.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

from datetime import datetime

def nearest(items, pivot):
    return min(items, key=lambda x: abs(x - pivot))

def select_images(gdf,bounds,date):

    bounds = shapely_loads(bounds.split(';')[-1])
    # bounds = list(bounds.geoms)[0]
    gdf["DATE"] = pd.to_datetime(gdf["OriginDate"].copy())
    gdf["DATE"] = gdf["DATE"].dt.tz_localize(None)
    
    contains = gdf[gdf.contains(bounds)]

    if len(contains)>0:
        near = nearest(contains['DATE'], date)
        contains = contains[contains['DATE']==near]
        return contains.head(1)

    unique = pd.unique(gdf['tile'])

    names = []
    for u in unique:
        un = gdf[gdf['tile']==u]
        near = nearest(un['DATE'], date)
        un = un[un['DATE']==near]
        names.append(un['Name'][un.index[0]])

    n = len(gdf)        
    gdf = gdf[gdf['Name'].isin(names)] 
    return gdf

class GetData(APIView):

    def post(self,request):
        def parse_geo(wkt):
            wkt = wkt.replace("geography'SRID=4326;","")
            wkt = wkt.replace("'","")
            return shapely_loads(wkt)
        

        d1 = request.data.get('date1', None)
        d2 = request.data.get('date2', None)
        wkt = request.data.get('bbox', None)

        date1 = datetime.strptime(d1,"%Y-%m-%d")
        date2 = datetime.strptime(d2,"%Y-%m-%d")

        if date1>date2:
            return Response({"error":"Date 1 should not be after Date 2"},status=status.HTTP_400_BAD_REQUEST)

        cloud = 1.0

        main_url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$"

        cc = f"Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value lt {cloud})"
        l2 = 'S2MSI2A'
        S2L2A = f"Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq '{l2}')"
        date = f"ContentDate/Start gt {d1} and ContentDate/Start lt {d2}"
        location = f"OData.CSC.Intersects(area=geography'SRID=4326;{wkt}')"

        URL = f"{main_url}filter={cc} and {S2L2A} and {date} and {location}"

        json = requests.get(URL).json()
        df = pd.DataFrame.from_dict(json['value'])

        if len(df)==0:
            return Response(
                {"Not found":"No images found for the provided period."},
                status=status.HTTP_204_NO_CONTENT)

        geom = df["Footprint"].map(parse_geo)

        gdf = gpd.GeoDataFrame(df,geometry=geom)
        gdf.set_crs(epsg=4326,inplace=True)
        
        gdf["tile"] = gdf["Name"].str[33:44]
        selected = select_images(gdf,wkt,date2)
        gdf = selected[["Name","OriginDate","ContentLength","Footprint","geometry"]]

        output = gdf.to_json()
        return Response(output,status=status.HTTP_200_OK)
