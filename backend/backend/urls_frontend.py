from django.views.generic import TemplateView
from django.urls import path

URLS = [
    '',
    'login/',
    'register/',
    'dashboard/',
    'request/',
    'map/',
    'requests/'
]

f = lambda x:path(x, TemplateView.as_view(template_name='index.html'))

urls = [
    f(i) for i in URLS
    # path('', TemplateView.as_view(template_name='index.html'))
]