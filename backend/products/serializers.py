from rest_framework import serializers
from .models import ModelsTrained, RequestProcess

class ModelsTrainedSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelsTrained
        fields = ('id', 'version', 'description', 'product', 'pth', 'poly')

class RequestProcessSerializer(serializers.ModelSerializer):
    pth = ModelsTrainedSerializer()

    class Meta:
        model = RequestProcess
        fields = ('id', 'pth', 'mask', 'user', 'done', 'bounds', 'created_at', 'updated_at')
