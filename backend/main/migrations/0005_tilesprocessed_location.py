# Generated by Django 4.1 on 2023-04-26 10:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0004_tilesprocessed_poly'),
    ]

    operations = [
        migrations.AddField(
            model_name='tilesprocessed',
            name='location',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
