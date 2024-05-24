from pathlib import Path
import os
from datetime import timedelta
from urllib import parse as urlparse
from dotenv import load_dotenv
import mimetypes

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

mimetypes.add_type("text/css", ".css", True)

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY_DF_WEBSITE')
DEBUG = os.environ.get("DEBUG")=='True'
LOCAL = os.environ.get("LOCAL")=="True"
# ALLOWED_HOSTS = []

testes = [
    f"test{i}"
    for i in range(1,11)
]

ALLOWED_HOSTS = [
    'deepforest.app',
    'https://*.deepforest.app',
    'v2.deepforest.app',
    'https://*.v2.deepforest.app',
    # "test2.deepforest.app",
    # 'https://*.test2.deepforest.app',
]
if os.environ['LOCAL'] == 'True':
    ALLOWED_HOSTS.append( '127.0.0.1')
    ALLOWED_HOSTS.append( 'localhost')
    ALLOWED_HOSTS.append('http://localhost:8000')
    ALLOWED_HOSTS.append("http://127.0.0.1:8000")
    ALLOWED_HOSTS.append('http://localhost:3000')
    ALLOWED_HOSTS.append("http://127.0.0.1:3000")

if os.environ["TESTING"]=="True":
    for i in testes:
        ALLOWED_HOSTS.append(f"{i}.deepforest.app")
        ALLOWED_HOSTS.append(f'https://*.{i}.deepforest.app')

# print(ALLOWED_HOSTS)

CSRF_TRUSTED_ORIGINS = [
    'https://deepforest.app',
    'https://v2.deepforest.app',
    'http://localhost:3000',
    "http://127.0.0.1:3000",
                        ]
SECURE_CROSS_ORIGIN_OPENER_POLICY = None
# CSRF_TRUSTED_ORIGINS = ['https://*.mydomain.com','https://*.127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    "django_rq",
    'corsheaders',
    'main',
    'users',
    'products',
    'forestmask',
    'storages',
    'rest_framework',
    'rest_framework_simplejwt',
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

CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    "http://127.0.0.1:3000",
    'http://localhost:8000',
    "http://127.0.0.1:8000",
    
    # 'http://localhost:5000',
]

SECURE_CROSS_ORIGIN_OPENER_POLICY = None

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, "build")

                 ],
        # "DIRS": [
        #     # os.path.join(BASE_DIR, "build")
        #     ],
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
         'PORT': os.environ.get("DB_PORT_DF_WEBSITE"),#'5432',
         'OPTIONS': {
            'sslmode': 'require',
            # 'connect_timeout': 3600,  # 10 minutes
            # 'options': '-c statement_timeout=0',  # Disable statement timeout
        },
        'DISABLE_SERVER_SIDE_CURSORS': True,
        "CONN_MAX_AGE":None,
        "CONN_HEALTH_CHECKS":True,
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

REDIS_HOST = os.environ.get("REDIS_HOST")
REDIS_PORT = os.environ.get("REDIS_PORT")
REDIS_USER = os.environ.get("REDIS_USERNAME")
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD")


RQ_QUEUES = {
    'default': {
        'HOST': REDIS_HOST,#"redis-16127.c91.us-east-1-3.ec2.redns.redis-cloud.com",#'localhost',
        'PORT': REDIS_PORT,#"16127",#6379,
        'DB': 0,#"FelipeMatheus-free-db",#0,
        'DEFAULT_TIMEOUT': 7200,
        # 'USERNAME': REDIS_USER,#'some-user',
        # 'PASSWORD': REDIS_PASSWORD,#'some-password',
    }
}

if not LOCAL:
    RQ_QUEUES['default']["USERNAME"] = REDIS_USER
    RQ_QUEUES['default']["PASSWORD"] = REDIS_PASSWORD


# RQ_QUEUES = {
#     'default': {
#         'HOST': 'localhost',
#         'PORT': 6379,
#         'DB': 0,
#         'DEFAULT_TIMEOUT': 7200,
#     }
# }

redis_url = urlparse.urlparse(
    os.environ.get('REDISTOGO_URL', 'redis://localhost:6379')
    )

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
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_PASS_DF_WEBSITE")
EMAIL_PORT = 587

##############################    AWS    ##############################
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID_DF_WEBSITE')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY_DF_WEBSITE')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME_DF_WEBSITE')

AWS_S3_FILE_OVERWRITE = False

AWS_S3_REGION_NAME = "us-east-2"
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_URL = os.environ.get("AWS_URL_DF_WEBSITE")

AWS_LOCATION = 'static'
S3_URL = '%s.s3.amazonaws.com' % AWS_STORAGE_BUCKET_NAME
STATIC_URL = f'https://{S3_URL}/{AWS_LOCATION}/'
AWS_S3_ENDPOINT_URL = "https://s3.us-east-2.amazonaws.com"
# STATIC_ROOT = 'https://%s/%s/static/' % (AWS_S3_CUSTOM_DOMAIN,STATICFILES_LOCATION)

STORAGES = {
    "default": {"BACKEND": 'storages.backends.s3boto3.S3Boto3Storage'},
    "staticfiles": {"BACKEND": 'storages.backends.s3boto3.S3Boto3Storage'},
    "OPTIONS": {
        "bucket_name": AWS_STORAGE_BUCKET_NAME,
        "region_name": AWS_S3_REGION_NAME,
        "signature_version": AWS_S3_SIGNATURE_VERSION,
},
}

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

