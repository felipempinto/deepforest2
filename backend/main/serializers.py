from rest_framework import serializers
from .models import Product,TilesProcessed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer,TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from users.models import User as CustomUser
from django.conf import settings
from .models import s3
BUCKET = settings.AWS_STORAGE_BUCKET_NAME

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        # fields = ('id','name','image','url')
        fields = "__all__"

# from django.contrib.auth import get_user_model

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        return data

class TilesSerializer(serializers.ModelSerializer):
    
    size = serializers.SerializerMethodField()
    mask_url = serializers.SerializerMethodField()

    class Meta:
        model = TilesProcessed
        fields = [
            "id",
            "name",
            "date_image",
            "product",
            "location",
            "mask_url",
            "size",
            "poly"
        ]

    def get_mask_url(self, obj):
        return obj.get_mask(obj.location)
    

    def get_size(self, obj):
        if obj.location:
            try:
                import boto3
                response = s3.head_object(
                    Bucket=BUCKET, 
                    Key=obj.location)
                return response.get('ContentLength', None)  # Size in bytes
            except Exception as e:
                print(e)
                return None
        return None