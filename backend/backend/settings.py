from pathlib import Path
import os
from datetime import timedelta
from urllib import parse as urlparse

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY_DF_WEBSITE')
DEBUG = os.environ.get("DEBUG")=='True'
LOCAL = os.environ.get("LOCAL")=="True"
# ALLOWED_HOSTS = []

ALLOWED_HOSTS = [
    'deepforest.app',
    'https://*.deepforest.app',
]
if os.environ['LOCAL'] == 'True':
    ALLOWED_HOSTS.append( '127.0.0.1',)
    ALLOWED_HOSTS.append( 'localhost',)
    

CSRF_TRUSTED_ORIGINS = ['https://deepforest.app',]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    'corsheaders',
    'main',
    'users',
    'products',
    'forestmask',
    'storages',
    'rest_framework',
    'rest_framework_simplejwt',
    "django_rq",
    # 'rest_framework_simplejwt.token_blacklist',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  # replace with your React app URL
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': {
         'ENGINE': 'django.contrib.gis.db.backends.postgis',
         'NAME': os.environ.get('DB_NAME_DF_WEBSITE'),
         'USER': os.environ.get('DB_USER_DF_WEBSITE'),
         'PASSWORD': os.environ.get('DB_PASSWORD_DF_WEBSITE'),
         'HOST': os.environ.get("DB_HOST_DF_WEBSITE"),
         'PORT': '5432',
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


RQ_QUEUES = {
    'default': {
        'HOST': 'localhost',
        'PORT': 6379,
        'DB': 0,
        'DEFAULT_TIMEOUT': 720,
    }
}

redis_url = urlparse.urlparse(os.environ.get('REDISTOGO_URL', 'redis://localhost:6379'))

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
        'LOCATION': '%s:%s' % (redis_url.hostname, redis_url.port),
        'OPTIONS': {
            'DB': 0,
            'PASSWORD': redis_url.password,
        }
    }
}

EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = os.environ.get("EMAIL_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_PASS_DEEPFOREST")
EMAIL_PORT = 587

##############################    AWS    ##############################
USE_S3 = os.getenv('USE_S3_DEEPFOREST') == 'True'
if USE_S3:
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID_DEEPFOREST')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY_DEEPFOREST')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME_DEEPFOREST')

    AWS_S3_FILE_OVERWRITE = False

    AWS_S3_REGION_NAME = "us-east-2"
    AWS_S3_SIGNATURE_VERSION = "s3v4"

    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'

    AWS_LOCATION = 'static'
    STATIC_URL = f'https://{AWS_STORAGE_BUCKET_NAME}/{AWS_LOCATION}/'
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_ROOT = os.path.join(BASE_DIR, 'static')
    #NEW
    AWS_URL = os.environ.get("AWS_URL_DEEPFOREST")

else:
    STATIC_URL = '/staticfiles/'
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'),)
STATICFILES_DIRS = (os.path.join('../frontend','build','static'),)

MEDIA_ROOT = os.path.join(BASE_DIR,'media')
MEDIA_URL = "/media/"


AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        # 'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

if LOCAL:
    REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'].append('rest_framework.authentication.SessionAuthentication')
    REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'].append('rest_framework.authentication.BasicAuthentication')


REST_AUTH_SERIALIZERS = {
    "USER_DETAILS_SERIALIZER":'users.serializers.UserSerializer',
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=120),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
  }


