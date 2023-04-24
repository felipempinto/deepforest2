from rest_framework import serializers
from .models import Product
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer,TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from users.models import User as CustomUser

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id','name','image','url')

# from django.contrib.auth import get_user_model

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
       data = super().validate(attrs)
       refresh = self.get_token(self.user)
       data['refresh'] = str(refresh)
       data['access'] = str(refresh.access_token)
       return data

# User = get_user_model()
# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)

#         # Add custom claims
#         token['username'] = user.username

#         return token

#     def validate(self, attrs):
#         data = super().validate(attrs)
#         user = User.objects.get(email=data['email'])
#         data['username'] = user.username
        # return data

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     def validate(self, attrs):
#         username = attrs.get("username")
#         password = attrs.get("password")

#         try:
#             user = CustomUser.objects.get(username=username)
#         except CustomUser.DoesNotExist:
#             raise serializers.ValidationError("No user found with the given username and password.")

#         if not user.check_password(password):
#             raise serializers.ValidationError("Password do not match.")
#         refresh = self.get_token(user)
#         data = {
#             "refresh": str(refresh),
#             "access": str(refresh.access_token),
#         }

#         return data

# class CustomTokenRefreshSerializer(TokenRefreshSerializer):
#     def validate(self, attrs):
#         try:
#             token = RefreshToken(attrs['refresh'])
#             token_payload = token.payload
#             user = CustomUser.objects.get(id=token_payload['user_id'])
#             token.blacklist()
#         except Exception as e:
#             raise InvalidToken(str(e))

#         data = {}
#         # refresh = self.get_token(user)
#         refresh = RefreshToken.for_user(user)
#         data['refresh'] = str(refresh)
#         data['access'] = str(refresh.access_token)
#         return data