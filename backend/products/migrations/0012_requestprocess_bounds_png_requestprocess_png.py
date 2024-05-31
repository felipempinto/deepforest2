# Generated by Django 5.0.1 on 2024-05-22 16:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_requestprocess_response'),
    ]

    operations = [
        migrations.AddField(
            model_name='requestprocess',
            name='bounds_png',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='requestprocess',
            name='png',
            field=models.FileField(blank=True, null=True, upload_to=''),
        ),
    ]