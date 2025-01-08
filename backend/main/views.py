from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework_simplejwt.views import TokenVerifyView,TokenRefreshView,TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.generics import CreateAPIView
from rest_framework import status

from .serializers import ProductSerializer,CustomTokenObtainPairSerializer,TilesSerializer
from .models import Product,TilesProcessed,TilesDownloaded

from datetime import datetime

from django.db.models import F
from django.contrib.gis.geos import Polygon
from django.utils import timezone
# from django.utils.timezone import make_aware

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


class UpdateTilesFromS3(CreateAPIView):
    authentication_classes = [JWTAuthentication]  
    permission_classes = [IsAdminUser] 

    def create(self, request, *args, **kwargs):
        
        product = request.data.get('product')
        if not product:
            product='forestmask'

        try:
            TilesProcessed.update_from_s3(product)
            return Response({'message': 'Tiles updated successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET','POST'])
def tiles_list(request):

    if request.method == 'GET':
        queryset = TilesProcessed.objects.all().order_by(F('date_image').asc(nulls_last=True))
        serializer = TilesSerializer(queryset, many=True)
        return Response(serializer.data)


    elif request.method == 'POST':
        date1 = request.data.get('date1', None)
        date2 = request.data.get('date2', None)
        product = request.data.get('product', None)
        bbox = request.data.get('bbox', None)

        product = Product.objects.get(id=product)
        
        if not product:
            queryset = TilesProcessed.objects.all().order_by(
                F('date_image').asc(nulls_last=True)
        )
        else:
            queryset = TilesProcessed.objects.filter(
                product=product
            ).order_by(F('date_image').asc(nulls_last=True))
        if date1 and date2:
            d1 = datetime.strptime(date1.split("T")[0], '%Y-%m-%d')
            d2 = datetime.strptime(date2.split("T")[0], '%Y-%m-%d')
            date1 = timezone.make_aware(d1,timezone.get_default_timezone()).date()
            date2 = timezone.make_aware(d2,timezone.get_default_timezone()).date()
            queryset = queryset.filter(date_image__range=(date1, date2))
        else:
            return Response({"error":"Date is missing!"},status=status.HTTP_400_BAD_REQUEST)

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


# class TileList(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     def get(self,request,tile_id):
#         try:
#             tile = TilesProcessed.objects.get(pk=tile_id)
#         except TilesProcessed.DoesNotExist:
#             raise NotFound('Tile not found.')

from rest_framework.generics import RetrieveAPIView

class RetrieveTile(RetrieveAPIView):
    queryset = TilesProcessed.objects.all()
    serializer_class = TilesSerializer
    lookup_field = 'name' 

class DownloadTileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, tile_id):
        try:
            tile = TilesProcessed.objects.get(pk=tile_id)
        except TilesProcessed.DoesNotExist:
            raise NotFound('Tile not found.')
        mask_url = tile.get_mask(tile.location)
        if not mask_url:
            return Response({'error': 'Failed to generate presigned URL'}, status=500)
        user = request.user
        TilesDownloaded.objects.create(user=user, tile=tile)
        return Response({'mask_url': mask_url})

    # def get(self, request, tile_id):
    #     # tile = get_object_or_404(TilesProcessed, pk=tile_id)
    #     tile = TilesProcessed.objects.get(pk=self.kwargs['pk'])
    #     mask_url = tile.get_mask(tile.location)
    #     if not mask_url:
    #         return Response({'error': 'Failed to generate presigned URL'}, status=500)
    #     user = request.user
    #     TilesDownloaded.objects.create(user=user, tile=tile)
    #     return Response({'error': 'Failed to generate presigned URL'}, status=500)

    #     # response = requests.get(mask_url)
    #     # content_type = response.headers['content-type']
    #     # content = response.content
    #     # file_name = f"{tile.name}.png"
    #     # response = HttpResponse(content, content_type=content_type)
    #     # response['Content-Disposition'] = f'attachment; filename="{file_name}"'
    #     # return response