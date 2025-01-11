from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import permissions, status,generics

from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import AccessToken

from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.mail import send_mail,EmailMultiAlternatives,EmailMessage
from django.conf import settings
from django.contrib.auth.views import PasswordResetConfirmView
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import get_list_or_404, get_object_or_404
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse_lazy
from django.template.loader import render_to_string

import os 
from .models import User
from .serializers import UserUpdateSerializer,UserCreateSerializer,UserSerializer


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

    return Response(user.data, status=status.HTTP_200_OK)



class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print("A")
        try:
            token = request.auth
            print("B")
            payload = token.payload
            print("C")
            user_id = payload['user_id']
            print("D")
        except (InvalidToken, KeyError):
            print("E")
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user_id != request.user.id:
            print("F")
            return Response({'detail': 'Token user does not match update user.'}, status=status.HTTP_401_UNAUTHORIZED)

        print("G")
        print(request.data)
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        print("H")
        if serializer.is_valid():
            print("I")
            serializer.save()
            print("J")
            return Response(serializer.data, status=status.HTTP_200_OK)
        print("K")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if request.user == instance:
            self.perform_destroy(instance)
            return Response(status=204)
        else:
            return Response({'detail': 'You do not have permission to delete this user.'}, status=403)
        

class ResetPassword(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        reset_url = os.environ.get("FRONT_URL")+f"password-reset-confirm/{uid}/{token}"
        
        subject = "Password Reset Requested"
        message = render_to_string('password_reset_email.html', {
            'user': user,
            'reset_url': reset_url,
        })
        email_message = EmailMultiAlternatives(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        email_message.attach_alternative(message, "text/html")
        
        email_message.send()
                
        return Response({'message': 'Password reset email sent successfully'})
