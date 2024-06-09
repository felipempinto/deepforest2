from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RequestBounds, User

@receiver(post_save, sender=RequestBounds)
def user_created_request(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        user.request += 1
        user.save()