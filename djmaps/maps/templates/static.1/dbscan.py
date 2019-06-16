from sklearn.cluster import DBSCAN
from sklearn import metrics
import requests
import pandas as pd
import numpy as np
import json
import math

def convertLatLonToMiles(lat1, lon1, lat2, lon2): 
	R = 6371e3
	phi1 = math.radians(lat1)
	phi2 = math.radians(lat2)
	deltaPhi = math.radians(lat2-lat1)
	deltaLambda = math.radians(lon2 - lon1)
	a = math.sin(deltaPhi/2) * math.sin(deltaPhi/2) + math.cos(phi1) * math.cos(phi2) * math.sin(deltaLambda/2) * math.sin(deltaLambda/2)
	c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
	d = R * c
	return d * 0.621371

with open('./dataCrime1.json', 'r+') as json_file:
	data = json.load(json_file)
	distBetweenPoints = [0.01,0.02,0.03,0.04,0.05,0.06,0.07,0.08,0.09]

	miles_per_radian = 3958.7613

	x = []
	for f in data['features']:
		latLong = (f['properties']['latitude'], f['properties']['longitude'])
		x.append(latLong)
		f["properties"]["0cluster"] = "-1"
		#print('Latitude: ' + str(f['properties']['latitude']))
		#print('Longitude: ' + str(f['properties']['longitude']))

	epsilon = 1

	for i in distBetweenPoints: 
		epsilon = i / miles_per_radian
		clustering = DBSCAN(eps=epsilon, min_samples=2, metric='haversine').fit(np.radians(x))
		labels = clustering.labels_
		numberClusters = len(set(labels)) - (1 if -1 in labels else 0)
		fileName = str(i) + "miles.txt"
		curFile = open(fileName, "w")
		k = 0
		for g in data['features']:
			clusterLabel = str(i) + "cluster"
			#print("clusterLabel: " + clusterLabel)
			g["properties"][clusterLabel] = labels[k]
			k += 1
		
		for j in labels:
			curFile.write('%s\n' % j)
		print(numberClusters)

#resp = requests.get('https://localhost:8001/dbscan/')

with open('./dataCrime1.json', "w") as json_data:
	json.dump(data, json_data, indent=4, sort_keys=True, default=str)

#array([ 0,  0,  0,  1,  1, -1])
#DBSCAN(algorithm='auto', eps=3, leaf_size=30, metric='euclidean',
    #metric_params=None, min_samples=2, n_jobs=None, p=None)
 