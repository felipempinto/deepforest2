from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenVerifyView,TokenRefreshView,TokenObtainPairView
from rest_framework.decorators import api_view

from .serializers import ProductSerializer,CustomTokenObtainPairSerializer,TilesSerializer
from .models import Product,TilesProcessed

from datetime import datetime
from django.contrib.gis.geos import Polygon

class ProductList(APIView):
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CustomTokenRefreshView(TokenRefreshView):
    pass

class CustomTokenVerifyView(TokenVerifyView):
    pass


@api_view(['POST'])
def tiles_list(request):
    date1 = request.data.get('date1', None)
    date2 = request.data.get('date2', None)
    product = request.data.get('product', None)
    bbox = request.data.get('bbox', None)

    # TilesProcessed.update_from_s3('forestmask')
    
    if not product:
        queryset = TilesProcessed.objects.all()
    else:
        queryset = TilesProcessed.objects.filter(product=product)

    if date1 and date2:
        date1 = datetime.strptime(date1, '%Y-%m-%d').date()
        date2 = datetime.strptime(date2, '%Y-%m-%d').date()
        queryset = queryset.filter(date_image__range=(date1, date2))

    if bbox is not None:
        try:
            bbox_coords = bbox.get('geometry', {}).get('coordinates')
            bbox_poly = Polygon(bbox_coords[0])
        except:
            bbox_poly = None
        # bbox_poly = Polygon.from_bbox(bbox['geometry']['coordinates'])
        queryset = queryset.filter(poly__intersects=bbox_poly)
    
    serializer = TilesSerializer(queryset, many=True)
    return Response(serializer.data)


def tiles_update(request):
    TilesProcessed.update_from_s3(product="forestmask")
