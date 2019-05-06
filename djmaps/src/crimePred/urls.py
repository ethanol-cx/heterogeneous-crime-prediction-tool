from django.urls import path, register_converter
from . import views, converters

# register converter from gridshape string (x,x) to tuple
register_converter(converters.gridShapeConverter, 'int,int')


urlpatterns = [
	path('cluster2', views.cluster2, name='cluster2'),
    path('cluster/<str:dataset>/<int,int:gridshape>/<int:threshold>',
         views.cluster, name='cluster'),
    path('predict', views.predict, name='predict')
]
