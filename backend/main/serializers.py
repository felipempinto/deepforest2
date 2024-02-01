from rest_framework import serializers
from .models import Product,TilesProcessed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer,TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from users.models import User as CustomUser

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
    
    mask_url = serializers.SerializerMethodField()

    class Meta:
        model = TilesProcessed
        fields = '__all__'

    def get_mask_url(self, obj):
        return obj.get_mask(obj.location)