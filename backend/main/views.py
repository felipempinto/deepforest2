from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenVerifyView,TokenRefreshView,TokenObtainPairView

from .serializers import ProductSerializer,CustomTokenObtainPairSerializer#,CustomTokenRefreshSerializer
from .models import Product
# from users.models import User

class ProductList(APIView):
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
# class CustomTokenObtainPairView(TokenObtainPairView):
#     serializer_class = CustomTokenObtainPairSerializer

# class CustomTokenRefreshView(TokenRefreshView):
#     serializer_class = CustomTokenRefreshSerializer

# class CustomTokenVerifyView(TokenVerifyView):
#     def token_user(self, token):
#         return User.objects.get(id=token['user_id'])

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CustomTokenRefreshView(TokenRefreshView):
    pass

class CustomTokenVerifyView(TokenVerifyView):
    pass

