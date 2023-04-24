from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from .models import User
from django.contrib.auth import get_user_model

class UserCreateSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    # fields = ('first_name', 'last_name', 'email', 'password')
    fields = ('username', 'email', 'password')#,'password2')

  def validate(self, data):
    user = User(**data)
    password = data.get('password')
    # password2 = data.get('password2')

    try:
      validate_password(password, user)
    except exceptions.ValidationError as e:
      serializer_errors = serializers.as_serializer_error(e)
      raise exceptions.ValidationError(
        {'password': serializer_errors['non_field_errors']}
      )
    return data


  def create(self, validated_data):
    user = User.objects.create_user(
      # first_name=validated_data['first_name'],
      # last_name=validated_data['last_name'],
      username=validated_data['username'],
      email=validated_data['email'],
      password=validated_data['password'],
    )

    return user


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    # model = get_user_model()
    fields = ('username', 'email',)
    # fields = []
    # read_only_fields = ()


# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile_picture')


# class UserCreateUpdateSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)

#     def create(self, validated_data):
#         user = User.objects.create_user(**validated_data)
#         return user

#     def update(self, instance, validated_data):
#         password = validated_data.pop('password', None)
#         if password:
#             instance.set_password(password)
#         return super().update(instance, validated_data)

#     class Meta:
#         model = User
#         fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile_picture', 'password')