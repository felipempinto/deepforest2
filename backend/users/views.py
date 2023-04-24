from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .serializers import UserCreateSerializer, UserSerializer

class RegisterView(APIView):
  def post(self, request):
    data = request.data
    serializer = UserCreateSerializer(data=data)

    if not serializer.is_valid():
      return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    user = serializer.create(serializer.validated_data)
    user = UserSerializer(user)

    return Response(user.data, status=status.HTTP_201_CREATED)


class RetrieveUserView(APIView):
  permission_classes = [permissions.IsAuthenticated]

  def get(self, request):
    user = request.user
    user = UserSerializer(user)
    print(user.data)

    return Response(user.data, status=status.HTTP_200_OK)


# from rest_framework import generics
# from rest_framework.permissions import IsAuthenticated
# # from .models import User
# from .serializers import  UserCreateUpdateSerializer #UserSerializer,

# class UserDetailView(generics.RetrieveUpdateAPIView):
#     serializer_class = UserCreateUpdateSerializer
#     permission_classes = (IsAuthenticated,)

#     def get_object(self):
#         return self.request.user