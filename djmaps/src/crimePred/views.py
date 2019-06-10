from django.shortcuts import render
from django.http import HttpResponse
from inspect import getsourcefile
import os
import pandas as pd
import sys
import numpy as np
import json
from ast import literal_eval
import datetime

# get the parent directory
current_path = os.path.abspath(getsourcefile(lambda: 0))
current_dir = os.path.dirname(current_path)
parent_dir = current_dir[:current_dir.rfind(os.path.sep)]

# change sys.path to parent_dir
sys.path.insert(0, parent_dir)

# import the packages from the parent directory
from prediction.fwdfiles.cluster_functions import computeClustersAndOrganizeData
from prediction.fwdfiles.general_functions import getBorderCordinates
from prediction.fwdfiles.forecast_MM import forecast_timeseries_MM
from prediction.fwdfiles.forecast_ARIMA import forecast_timeseries_ARIMA
from prediction.fwdfiles.forecast_LSTM import forecast_timeseries_LSTM, load_LSTM_model

# reset the sys.path
sys.path.pop(0)


def index(request):
    return HttpResponse('This is the crimePred index.')

def cluster2(request):
    print("CLUSTERING")
    pd.options.display.precision = 10
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    features = body['features']
    threshold = int(body['threshold'])
    gridshape = literal_eval(body['gridShape'])
    entries = []
    lon_min = -118.297
    lon_max = -118.27
    lat_min = 34.015
    lat_max = 34.038
    print(len(features))
    for f in features:
        d = f['properties']['time'].split('T')[0]
        y, m, d = map(int, d.split('-'))
        if y == 0:
            continue
        if float(f['properties']['latitude']) >= lat_min and float(f['properties']['latitude']) <= lat_max and float(f['properties']['longitude']) >= lon_min and float(f['properties']['longitude']) <= lon_max:
            entries.append([f['properties']['Category'], float(f['properties']['latitude']), float(f['properties']['longitude']), datetime.date(y, m, d)])
    print("DONE PREPROCESSING")
    data = pd.DataFrame(np.array(entries), columns=['Category', 'Latitude', 'Longitude', "Date"])
    data.sort_values(['Latitude', 'Longitude', 'Date'], inplace=True)
    data = data.reset_index(drop=True)
    ignoreFirst = 225
    clusters, realCrimes = computeClustersAndOrganizeData(data, gridshape, ignoreFirst, threshold, 1)
    border_result = []
    crime_counts = []
    for geometry in clusters.Geometry:
        num_of_crimes = 0
        geometry_array = geometry.toarray()
        border_set = set()
        for i in range(len(geometry_array)):
            row = geometry_array[i]
            for j in range(len(row)):
                if row[j] == 0:
                    continue
                borders = getBorderCordinates(
                    lon_max, lon_min, lat_max, lat_min, gridshape, i, j)
                for border in borders:
                    if border not in border_set:
                        border_set.add(border)
                    else:
                        border_set.remove(border)
                num_of_crimes += row[j]
        border_result.append(list(border_set))
        crime_counts.append(num_of_crimes)
        num_of_crimes = 0
    print(pd.io.json.dumps([border_result, crime_counts]))
    return HttpResponse(pd.io.json.dumps([border_result, crime_counts]))
        
def cluster(request, dataset, gridshape, threshold):
    if dataset == 'dps':
        data = pd.read_pickle(os.path.abspath(
            './prediction/dataset/DPSUSC.pkl'))
        ignoreFirst = 225
        lon_min = -118.301895
        lon_max = -118.27
        lat_min = 34.015
        lat_max = 34.0366
        print(data)
    elif dataset == 'la':
        data = pd.read_pickle(os.path.abspath(
            './prediction/dataset/LAdata.pkl'))
        lon_min = -118.301895
        lon_max = -118.27
        lat_min = 34.015
        lat_max = 34.0366
        ignoreFirst = 104
    else:
        response = HttpResponse(
            'Wrong dataset. Should choose from \'dps\' or \'la\'')
        response.status_code = 422
        return response
    try:
        clusters, realCrimes = computeClustersAndOrganizeData(
            data, gridshape, ignoreFirst, threshold, 1)
        border_result = []
        crime_counts = []
        for geometry in clusters.Geometry:
            num_of_crimes = 0
            geometry_array = geometry.toarray()
            border_set = set()
            for i in range(len(geometry_array)):
                row = geometry_array[i]
                for j in range(len(row)):
                    if row[j] == 0:
                        continue
                    borders = getBorderCordinates(
                        lon_max, lon_min, lat_max, lat_min, gridshape, i, j)
                    for border in borders:
                        if border not in border_set:
                            border_set.add(border)
                        else:
                            border_set.remove(border)
                    num_of_crimes += row[j]
            border_result.append(list(border_set))
            crime_counts.append(num_of_crimes)
            num_of_crimes = 0
        response = HttpResponse(pd.io.json.dumps(
            [border_result, crime_counts]))
        response.status_code = 200
        return response
    except:
        response = HttpResponse('Internal server error with the followint inputs:\ndataset: {}, gridshape: {}, threshold: {}'.format(
            dataset, gridshape, threshold))
        response.status_code = 400
        return response


def predict(request):
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)

    timeseries = body['timeseries']
    method = body['method']
    periodsAhead_list = body['periodsAhead_list']
    name = body['name']
    gridshape = "NONE" if not 'gridshape' in body else body['gridshape']
    ignoreFirst = "NONE" if not 'ignoreFirst' in body else body['ignoreFirst']
    threshold = "NONE" if not 'threshold' in body else body['threshold']

    if threshold and threshold != 0:
        max_dist = 1
    else:
        max_dist = 0

    forecasted_data = np.zeros((len(periodsAhead_list), 1, len(timeseries) // 3))

    if method == 'MM':
        forecast_timeseries_MM(timeseries, forecasted_data, 0,
                               periodsAhead_list, gridshape, ignoreFirst, threshold, max_dist)
    elif method == "ARIMA":
        forecast_timeseries_ARIMA(timeseries, forecasted_data, 0, 0,
                                  periodsAhead_list, gridshape, ignoreFirst, threshold, max_dist)
    elif method == "LSTM":
        model = load_LSTM_model(10, 1)
        forecast_timeseries_LSTM(model, timeseries, forecasted_data, 10, 1,
                                 0, 0, periodsAhead_list, gridshape, ignoreFirst, threshold, max_dist, name)
    else:
        response = HttpResponse(
            'Wrong dataset. Should choose from \'dps\' or \'la\'')
        response.status_code = 422
        return response

    response = HttpResponse(pd.io.json.dumps(forecasted_data.reshape(
        -1, len(timeseries) // 3)))
    response.status_code = 200
    return response
