from rest_framework import serializers
from .models import ImagesLocation

class ImagesLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagesLocation
        fields = ['name', 'date', 'img','poly']
