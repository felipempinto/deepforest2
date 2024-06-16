from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.contrib.gis import geos
import shapely.wkt as wkt
from shapely.geometry import MultiPolygon

from .models import (
                    ModelsTrained, 
                    # RequestProcess,
                    TrainModel,
                    RequestBounds
                    )#,RequestVisualization
from .utils import check_area
# from .download_and_process import check_area


class TrainDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainModel
        fields = '__all__'

class ModelsTrainedSerializer(serializers.ModelSerializer):
    product = serializers.StringRelatedField()
    class Meta:
        model = ModelsTrained
        fields = '__all__'

        
class GeoJSONSerializer(serializers.Serializer):
    geojsonData = serializers.JSONField()

class VisualRequestProcessSerializer(serializers.ModelSerializer):

    mask_url = serializers.SerializerMethodField()
    geojson = serializers.SerializerMethodField()

    class Meta:
        model = RequestBounds
        fields = ["id","name","bounds","png","bounds_png","mask_url","geojson"]

    def get_mask_url(self, obj):
        mask_url = obj.get_mask()
        return mask_url
    
    def get_geojson(self,obj):
        geojson = obj.bounds.geojson
        return geojson

class RequestProcessSerializer(serializers.ModelSerializer):

    mask_url = serializers.SerializerMethodField()
    geojson = serializers.SerializerMethodField()

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and request.method == 'GET':
            fields['pth'] = ModelsTrainedSerializer()

        return fields

    class Meta:
        model = RequestBounds
        fields = '__all__'
    
    def get_geojson(self,obj):
        geojson = obj.bounds.geojson
        return geojson

    def get_mask_url(self, obj):
        mask_url = obj.get_mask()
        return mask_url

    def validate_bounds(self, value,max_area = 5000):

        poly = wkt.loads(value)
        area = check_area(poly)
        if area>max_area:
            raise serializers.ValidationError(f'Polygon size is too big, maximum size allowed = {max_area}')
        multi = MultiPolygon([poly])
        try:
            return GEOSGeometry(multi.wkt)
        except (ValueError, TypeError, GEOSException) as e:
            raise serializers.ValidationError(str(e))

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        validated_data['user'] = user

        return super().create(validated_data)
