from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.contrib.gis import geos
import shapely.wkt as wkt
from shapely.geometry import MultiPolygon

from .models import ModelsTrained, RequestProcess
from .download_and_process import check_area

class ModelsTrainedSerializer(serializers.ModelSerializer):
    product = serializers.StringRelatedField()
    class Meta:
        model = ModelsTrained
        fields = '__all__'

class RequestProcessSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestProcess
        fields = '__all__'#['name','date_requested','bounds', 'pth']

    def validate_bounds(self, value,max_area = 5000):
        # print("AAAA",value)

        poly = wkt.loads(value)
        area = check_area(poly)
        print(area,max_area)
        if area>max_area:
            raise serializers.ValidationError(f'Polygon size is too big, maximum size allowed = {max_area}')
        multi = MultiPolygon([poly])

        try:
            # return GEOSGeometry(value)
            return GEOSGeometry(multi.wkt)
        except (ValueError, TypeError, GEOSException) as e:
            raise serializers.ValidationError(str(e))

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        validated_data['user'] = user
        print("RUNNING WITH THE FOLLOWING DATA:",validated_data)

        return super().create(validated_data)


class GeoJSONSerializer(serializers.Serializer):
    geojsonData = serializers.JSONField()
