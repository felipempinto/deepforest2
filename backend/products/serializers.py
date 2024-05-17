from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.contrib.gis import geos
import shapely.wkt as wkt
from shapely.geometry import MultiPolygon

from .models import ModelsTrained, RequestProcess,TrainModel,RequestVisualization
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

class ModelsTrainedDataSerializer(serializers.ModelSerializer):
    product = serializers.StringRelatedField()

    class Meta:
        model = ModelsTrained
        exclude = ("pth_path","pth")


class GeoJSONSerializer(serializers.Serializer):
    geojsonData = serializers.JSONField()

class RequestProcessSerializer(serializers.ModelSerializer):

    pth = ModelsTrainedDataSerializer()#ModelsTrainedSerializer()
    mask_url = serializers.SerializerMethodField()
    geojson = serializers.SerializerMethodField()

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and request.method == 'GET':
            # fields['pth'] = ModelsTrainedDataSerializer()#ModelsTrainedSerializer()


            #GAMBIARRA MODE
            if request.user.username=="admin":
                print("USER IS ADMIN (message from products.serializers.py)")
                fields['pth'] = ModelsTrainedSerializer()
            else:
                print("USER IS NOT ADMIN (message from products.serializers.py)")


        return fields

    class Meta:
        model = RequestProcess
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
            # return GEOSGeometry(value)
            return GEOSGeometry(multi.wkt)
        except (ValueError, TypeError, GEOSException) as e:
            raise serializers.ValidationError(str(e))

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        validated_data['user'] = user
        # print("RUNNING WITH THE FOLLOWING DATA:",validated_data)

        return super().create(validated_data)

class RequestVisualizationSerializer(serializers.ModelSerializer):
    request = RequestProcessSerializer()

    class Meta:
        model = RequestVisualization
        fields = ('id', 'request', 'png', 'bounds')

    def create(self, validated_data):
        request_data = validated_data.pop('request')
        request = RequestProcess.objects.create(**request_data)
        visualization = RequestVisualization.objects.create(request=request, **validated_data)
        return visualization

    def update(self, instance, validated_data):
        request_data = validated_data.pop('request')
        request_serializer = RequestProcessSerializer(instance.request, data=request_data)
        if request_serializer.is_valid():
            request_serializer.save()
        instance.png = validated_data.get('png', instance.png)
        instance.bounds = validated_data.get('bounds', instance.bounds)
        instance.save()
        return instance