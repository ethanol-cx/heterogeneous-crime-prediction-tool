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
import pandas as pd
import pickle 
import subprocess
import base64

# get the parent directory
current_path = os.path.abspath(getsourcefile(lambda: 0))
current_dir = os.path.dirname(current_path)
parent_dir = current_dir[:current_dir.rfind(os.path.sep)]

# change sys.path to parent_dir
sys.path.insert(0, parent_dir)

# import the packages from the parent directory
from prediction.fwdfiles.cluster_functions import computeClustersAndOrganizeData
from prediction.fwdfiles.general_functions import getBorderCordinates, compute_resource_allocation
from prediction.fwdfiles.forecast_MM import forecast_MM
from prediction.fwdfiles.forecast_ARIMA import forecast_ARIMA
from prediction.fwdfiles.forecast_LSTM import forecast_LSTM, load_LSTM_model
 
 # reset the sys.path
sys.path.pop(0)


def addEdge(neighbor_map, u, v):
    if u not in neighbor_map:
        neighbor_map[u] = set([v])
    else:
        neighbor_map[u].add(v)
    if v not in neighbor_map:
        neighbor_map[v] = set([u])
    else:
        neighbor_map[v].add(u)


def removeEdge(neighbor_map, u, v):
    neighbor_map[u].remove(v)
    neighbor_map[v].remove(u)


def reachableNeighborCount(neighbor_map, u, visited):
    count = 1
    visited.add(u)
    for neighbor in list(neighbor_map[u]):
        if neighbor not in neighbor_map[u]:
            break
        if neighbor not in visited:
            count += reachableNeighborCount(neighbor_map, neighbor, visited)
    return count


def isNextNode(neighbor_map, u, v):
    if len(neighbor_map[u]) == 1:
        return True
    else:
        count1 = reachableNeighborCount(neighbor_map, u, set())
        removeEdge(neighbor_map, u, v)
        count2 = reachableNeighborCount(neighbor_map, u, set())
        addEdge(neighbor_map, u, v)
        return False if count1 > count2 else True


def printGraph(neighbor_map):
    for key, value in neighbor_map.items():
        print(key, ':', value)


def fleuryEulerianCircuit(neighbor_map, u, node_path):
    for v in list(neighbor_map[u]):
        if v not in neighbor_map[u]:
            break
        if isNextNode(neighbor_map, u, v):
            node_path.append(v)
            removeEdge(neighbor_map, u, v)
            fleuryEulerianCircuit(neighbor_map, v, node_path)


def index(request):
    return HttpResponse('This is the crimePred index.')

def convertFromFeaturesToData(features):
    lon_min = -118.297
    lon_max = -118.27
    lat_min = 34.015
    lat_max = 34.038
    data = pd.DataFrame(features, columns=['Category', 'Latitude', 'Longitude', 'Date'])
    print(data.head)
    print("Minimum latitude: %f" % min(data["Latitude"]))
    print("Maximum latitude: %f" % max(data["Latitude"]))
    print("Minimum longitude: %f" % min(data["Longitude"]))
    print("Maximum longitude: %f" % max(data["Longitude"]))
    print("Number of datapoints before selecting: {}".format(len(data.index)))
    # Select square window
    data = data[(lat_min <= data.Latitude) & (data.Latitude <= lat_max)
                & (lon_min <= data.Longitude) & (data.Longitude <= lon_max)]
    print("Number of datapoints after selecting: {}".format(len(data.index)))
    data.sort_values(['Latitude', 'Longitude', 'Date'], inplace=True)
    data = data.reset_index(drop=True)
    return data

def heterogeneousCluster(request):
    lon_min = -118.297
    lon_max = -118.27
    lat_min = 34.015
    lat_max = 34.038

    print("CLUSTERING")
    pd.options.display.precision = 10
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    features = body['features']
    threshold = int(body['threshold'])
    gridshape = literal_eval(body['gridShape'])
    entries = []
    data = convertFromFeaturesToData(features)
    ignoreFirst = 225
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
        neighbor_map = {}
        for border in border_set:
            addEdge(neighbor_map, border[:2], border[2:])
        print('Start Finding Eulerian path...')
        node_path = []
        start_point = next(iter(border_set))[:2]
        fleuryEulerianCircuit(neighbor_map, start_point, node_path)
        print(node_path)
        border_result.append(node_path)
        crime_counts.append(num_of_crimes)
        num_of_crimes = 0
    resp = HttpResponse(pd.io.json.dumps([border_result, crime_counts]))
    resp['Access-Control-Allow-Origin'] = '*'
    return resp


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
        response['Access-Control-Allow-Origin'] = '*'
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
        response['Access-Control-Allow-Origin'] = '*'
        return response
    except:
        response = HttpResponse('Internal server error with the followint inputs:\ndataset: {}, gridshape: {}, threshold: {}'.format(
            dataset, gridshape, threshold))
        response.status_code = 400
        response['Access-Control-Allow-Origin'] = '*'
        return response

def clusterAndPredict(request):
    lon_min = -118.297
    lon_max = -118.27
    lat_min = 34.015
    lat_max = 34.038

    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    data = convertFromFeaturesToData(body['features'])
    gridshape = tuple((int(body['grid-x']), int(body['grid-y'])))
    print('gridshape {}'.format(gridshape))
    method = body['method']
    threshold = int(body['threshold'])
    metricPrecision = int(body['metricPrecision'])
    metricMax = int(body['metricMax'])
    maxDist = 1
    ignoreFirst = 225
    periodsAhead_list = [int(body['periodsAhead'])] 

    # Compute the cluster/grid distribution based on the threshold.
    print('Computing clusters ...')

    # In grid_prediction, which predict the crimes without clustering, the threshold is set to 0
    # `clusters` is the cluster distributions
    clusters, realCrimes = computeClustersAndOrganizeData(
        data, gridshape, ignoreFirst, threshold, maxDist)

    print('Number of clusters: {}'.format(len(clusters)))
    print('Computing predictions ...')

    result = ''
    if method == "LSTM":
        forecast_LSTM(clusters=clusters, realCrimes=realCrimes,
                          periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist)
    elif method == "ARIMA" or method == "AR":
        forecast_ARIMA(method=method, clusters=clusters, realCrimes=realCrimes,
                           periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, orders=[], seasonal_orders=[])
    else:
        forecast_MM(method=method, clusters=clusters, realCrimes=realCrimes,
                        periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist)

    resource_indexes = range(0, metricMax, metricPrecision)
    file_path = compute_resource_allocation(resource_indexes, 1, [gridshape], periodsAhead_list, ignoreFirst, [threshold], 1, [method], lon_min, lon_max, lat_min, lat_max)

    filename = "{}_{}_({}x{})({})_{}_ahead.png".format('LA' if ignoreFirst == 104 else 'USC', method, gridshape[0], gridshape[1], threshold, periodsAhead_list[0])
    os.makedirs(os.path.abspath("results/"), exist_ok=True)
    os.makedirs(os.path.abspath(
            "results/plot"), exist_ok=True)
    image_path = os.path.abspath('results/plot/{}').format(filename)

    # result = pd.read_pickle(file_path)
    # plt.plot(result)
    # # plt.legend()
    # plt.savefig(image_path)
    # plt.close()
    print('Done saving')

    subprocess.run(['python3', os.path.abspath('djmaps/plotResult.py'), file_path, image_path])
    with open(image_path, "rb") as imageFile:
        image_data = base64.b64encode(imageFile.read())
    print('Got Image Data')
    response = HttpResponse(image_data)
    response['Access-Control-Allow-Origin'] = '*'
    response.status_code = 200
    return response

# def predict(request):
#     body_unicode = request.body.decode('utf-8')
#     body = json.loads(body_unicode)

#     timeseries = body['timeseries']
#     method = body['method']
#     periodsAhead_list = body['periodsAhead_list']
#     name = body['name']
#     gridshape = "NONE" if not 'gridshape' in body else body['gridshape']
#     ignoreFirst = "NONE" if not 'ignoreFirst' in body else body['ignoreFirst']
#     threshold = "NONE" if not 'threshold' in body else body['threshold']

#     if threshold and threshold != 0:
#         max_dist = 1
#     else:
#         max_dist = 0

#     forecasted_data = np.zeros(
#         (len(periodsAhead_list), 1, len(timeseries) // 3))

#     if method == 'MM':
#         forecast_timeseries_MM(timeseries, forecasted_data, 0,
#                                periodsAhead_list, gridshape, ignoreFirst, threshold, max_dist)
#     elif method == "ARIMA":
#         forecast_timeseries_ARIMA(timeseries, forecasted_data, 0, 0,
#                                   periodsAhead_list, gridshape, ignoreFirst, threshold, max_dist)
#     elif method == "LSTM":
#         model = load_LSTM_model(10, 1)
#         forecast_timeseries_LSTM(model, timeseries, forecasted_data, 10, 1,
#                                  0, 0, periodsAhead_list, gridshape, ignoreFirst, threshold, max_dist, name)
#     else:
#         response = HttpResponse(
#             'Wrong dataset. Should choose from \'dps\' or \'la\'')
#         response.status_code = 422
#         return response

#     response = HttpResponse(pd.io.json.dumps(forecasted_data.reshape(
#         -1, len(timeseries) // 3)))
#     response.status_code = 200
#     return response