from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException

from .models import ModelsTrained, RequestProcess

class ModelsTrainedSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelsTrained
        fields = '__all__'

class RequestProcessSerializer(serializers.ModelSerializer):

    class Meta:
        model = RequestProcess
        fields = '__all__'#['name','date_requested','bounds', 'pth']

    def validate_bounds(self, value):
        try:
            return GEOSGeometry(value)
        except (ValueError, TypeError, GEOSException) as e:
            raise serializers.ValidationError(str(e))
        
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        print(user)

        validated_data['user'] = user

        return super().create(validated_data)