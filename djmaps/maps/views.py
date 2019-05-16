from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from inspect import getsourcefile
from sklearn.cluster import DBSCAN
from sklearn import metrics
import numpy as np
import os
import pandas as pd
import sys
import json
from keras import backend as K

# Create your views here.
def index(request):
	#TODO: move this token to Django settings from an environment variable
	#found in the Mapbox account settings and getting started instructions
	#see https://www.mapbox.com/account/ under the "Access tokens" section
	return render(request, 'default.html')

def dbscan(request):
	#Before prediction
	K.clear_session()
	body_unicode = request.body.decode('utf-8')
	data = json.loads(body_unicode)
	if request.method == 'POST':

		#distBetweenPoints = []
		#for inc in np.arange(0.0001, 0.09, 0.0001): 
			#distBetweenPoints.append(inc)

		miles_per_radian = 3958.7613
		x = []
		for f in data['features']:
			latLong = (f['properties']['latitude'], f['properties']['longitude'])
			x.append(latLong)
			f["properties"]["0cluster"] = "-1"
			#print('Latitude: ' + str(f['properties']['latitude']))
			#print('Longitude: ' + str(f['properties']['longitude']))

		epsilon = 1.0
		dist = float(data['dist'])
		epsilon = dist / miles_per_radian
		clustering = DBSCAN(eps=epsilon, min_samples=2, metric='haversine').fit(np.radians(x))
		labels = clustering.labels_
		numberClusters = len(set(labels)) - (1 if -1 in labels else 0)
		k = 0
		for g in data['features']:
			clusterLabel = str(dist) + "cluster"
			#print("clusterLabel: " + clusterLabel)
			g["properties"][clusterLabel] = str(labels[k])
			k += 1

		df = pd.DataFrame(data['features'])

		K.clear_session()
		return HttpResponse(df.to_json())
