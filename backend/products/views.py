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

from .models import ModelsTrained, RequestProcess
from .serializers import *

class RequestVisualizationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = VisualRequestProcessSerializer#RequestVisualizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # return RequestVisualization.objects.filter(request__user=self.request.user)
        return RequestProcess.objects.filter(request__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(request__user=self.request.user)

class RequestVisualizationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VisualRequestProcessSerializer#RequestVisualizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # return RequestVisualization.objects.filter(request__user=self.request.user)
        return RequestProcess.objects.filter(request__user=self.request.user)

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
    serializer_class = ModelsTrainedDataSerializer

class ModelsTrainedRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ModelsTrained.objects.all()
    serializer_class = ModelsTrainedSerializer

class RequestProcessListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = RequestProcess.objects.all()
    serializer_class = RequestProcessSerializer

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

        # columns = ["Id","Name","OriginDate","S3Path","ContentLength","geometry"]
        # gdf = gdf[columns]

        # gdf.rename(columns={"Name":"title"},inplace=True)
        # for i in gdf.columns:
        #     print(i,gdf[i])
        # print(gdf.to_json())
        # gdf = gdf.drop('Checksum', axis=1)
        # gdf.to_file("Teste.geojson",driver="GeoJSON")

        
        gdf["tile"] = gdf["Name"].str[33:44]
        selected = select_images(gdf,wkt,date2)
        gdf = selected[["Name","OriginDate","ContentLength","Footprint","geometry"]]
        # output = {
        #     "original":gdf.to_json(),
        #     "selected":selected.to_json()
        # }

        output = gdf.to_json()
        return Response(output,status=status.HTTP_200_OK)
