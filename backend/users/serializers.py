from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from .models import User
from django.contrib.auth import get_user_model

class UserCreateSerializer(serializers.ModelSerializer):
  password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)
  class Meta:
    model = User
    # fields = ('first_name', 'last_name', 'email', 'password')
    # fields = ('username', 'email', 'password')
    fields = ['username', 'email', 'password', 'password2']
    extra_kwargs = {
            'password': {'write_only': True}
        }

  def validate(self, data):
    # print(**data)
    password = data.get('password')
    password2 = data.get('password2')
    if password != password2:
        raise serializers.ValidationError("Passwords do not match.")

    _ = data.pop('password2')
    user = User(**data)
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
      username=validated_data['username'],
      email=validated_data['email'],
      password=validated_data['password'],
    )

    return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile_picture']


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    # model = get_user_model()
    # fields = ('username', 'email',)
    fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_picture']
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