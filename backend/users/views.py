from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
# from .models import User
from .serializers import  UserCreateUpdateSerializer #UserSerializer,

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserCreateUpdateSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user