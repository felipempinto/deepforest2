# Generated by Django 5.0.1 on 2024-05-20 21:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0010_requestprocess_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='requestprocess',
            name='response',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
