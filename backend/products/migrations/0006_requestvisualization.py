# Generated by Django 4.1 on 2024-02-05 12:22

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_alter_trainmodel_optimizer'),
    ]

    operations = [
        migrations.CreateModel(
            name='RequestVisualization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('png', models.CharField(max_length=200)),
                ('request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.requestprocess')),
            ],
        ),
    ]
