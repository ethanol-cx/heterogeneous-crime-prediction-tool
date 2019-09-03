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
import matplotlib.pyplot as plt

lon_min = -118.297
lon_max = -118.27
lat_min = 34.015
lat_max = 34.038

# get the parent directory
current_path = os.path.abspath(getsourcefile(lambda: 0))
current_dir = os.path.dirname(current_path)
parent_dir = current_dir[:current_dir.rfind(os.path.sep)]

# change sys.path to parent_dir
sys.path.insert(0, parent_dir)

# import the packages from the parent directory
from prediction.fwdfiles.forecast_LSTM import forecast_LSTM, load_LSTM_model
from prediction.fwdfiles.forecast_ARIMA import forecast_ARIMA
from prediction.fwdfiles.forecast_MM import forecast_MM
from prediction.fwdfiles.general_functions import getBorderCordinates, compute_resource_allocation
from prediction.fwdfiles.cluster_functions import computeClustersAndOrganizeData

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


def fleuryEulerianCircuit(neighbor_map, u, node_path):
    for v in list(neighbor_map[u]):
        if v not in neighbor_map[u]:
            break
        if isNextNode(neighbor_map, u, v):
            node_path.append(v)
            removeEdge(neighbor_map, u, v)
            fleuryEulerianCircuit(neighbor_map, v, node_path)


def convertFromFeaturesToData(features):
    data = pd.DataFrame(features, columns=[
                        'Category', 'Latitude', 'Longitude', 'Date'])
    # print(data.head)
    # print("Minimum latitude: %f" % min(data["Latitude"]))
    # print("Maximum latitude: %f" % max(data["Latitude"]))
    # print("Minimum longitude: %f" % min(data["Longitude"]))
    # print("Maximum longitude: %f" % max(data["Longitude"]))
    # print("Number of datapoints before selecting: {}".format(len(data.index)))
    # Select square window
    data = data[(lat_min <= data.Latitude) & (data.Latitude <= lat_max)
                & (lon_min <= data.Longitude) & (data.Longitude <= lon_max)]
    # print("Number of datapoints after selecting: {}".format(len(data.index)))
    data.sort_values(['Latitude', 'Longitude', 'Date'], inplace=True)
    data = data.reset_index(drop=True)
    return data


def heterogeneousCluster(request):
    pd.options.display.precision = 10
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    features = body['features']
    threshold = int(body['threshold'])
    gridshape = literal_eval(body['gridShape'])
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
        border_result.append(node_path)
        crime_counts.append(num_of_crimes)
    resp = HttpResponse(pd.io.json.dumps(
        [border_result, crime_counts, clusters, realCrimes]))
    resp['Access-Control-Allow-Origin'] = '*'
    return resp


def plot_resource_allocation(ax, gridshapes, periodsAhead, thresholds, methods, ignoreFirst):
    for i in range(len(methods)):
        method = methods[i]
        ax[i].set_ylabel('fractions of crimes avoided')
        for threshold in thresholds:
            for gridshape in gridshapes:
                file = os.path.abspath("results/resource_allocation/{}_{}_({}x{})({})_{}_ahead.pkl".format(
                    'LA' if ignoreFirst == 104 else 'USC', method, gridshape[0], gridshape[1], threshold, periodsAhead))
                with open(file, "rb") as ifile:
                    result = pickle.load(ifile)
                if threshold != 0:
                    ax[i].plot(result, marker='o', alpha=0.85)
                    ax[i].legend()
                    continue
                ax[i].plot(result, alpha=0.85)
                ax[i].legend()


def predict(request):
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    gridshape = tuple((int(body['grid-x']), int(body['grid-y'])))
    method = body['method']
    threshold = int(body['threshold'])
    maxDist = 1
    ignoreFirst = 225
    periodsAhead_list = [int(body['periodsAhead'])]
    isRetrainingModel = body['retrainModel']
    isModelEvaluation = False
    clusters = body['clusters']
    realCrimes = body['realCrimes']
    modelName = body['modelName']

    if method == "LSTM":
        result_path = forecast_LSTM(clusters=clusters, realCrimes=realCrimes,
                                    periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, isRetraining=isRetrainingModel, isModelEvaluation=isModelEvaluation, modelName=modelName)
    elif method == "ARIMA" or method == "AR":
        result_path = forecast_ARIMA(method=method, clusters=clusters, realCrimes=realCrimes,
                                     periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, isRetraining=isRetrainingModel, isModelEvaluation=isModelEvaluation, modelName=modelName)
    else:
        result_path = forecast_MM(method=method, clusters=clusters, realCrimes=realCrimes,
                                  periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, isModelEvaluation=isModelEvaluation, modelName=modelName)

    clusters, _, forecasts = pd.read_pickle(result_path)
    crimesPredictedPerCluster = [
        round(sum(forecasts[columnName][-periodsAhead_list[0]:]), 3) for columnName in forecasts]
    response = HttpResponse(pd.io.json.dumps(
        crimesPredictedPerCluster))
    response['Access-Control-Allow-Origin'] = '*'
    response.status_code = 200
    return response


def evaluate(request):
    maxDist = 1
    ignoreFirst = 225
    isModelEvaluation = True
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    periodsAhead_list = [int(body['periodsAhead'])]
    isRetrainingModel = True
    features = body['features']
    data = convertFromFeaturesToData(features)
    thresholds = body['thresholds']
    gridshapes = [tuple(gridshape) for gridshape in body['gridshapes']]
    methods = body['methods']
    resource_indexes = body['resource_indexes']
    for gridshape in gridshapes:
        for threshold in thresholds:
            clusters, realCrimes = computeClustersAndOrganizeData(
                data, gridshape, ignoreFirst, threshold, 1)
            clusters = clusters.to_dict()
            realCrimes = realCrimes.to_dict()
            for method in methods:
                if method == "LSTM":
                    result_path = forecast_LSTM(clusters=clusters, realCrimes=realCrimes,
                                                periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, isRetraining=isRetrainingModel, isModelEvaluation=isModelEvaluation)
                elif method == "ARIMA" or method == "AR":
                    result_path = forecast_ARIMA(method=method, clusters=clusters, realCrimes=realCrimes,
                                                 periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, isRetraining=isRetrainingModel, isModelEvaluation=isModelEvaluation)
                else:
                    result_path = forecast_MM(method=method, clusters=clusters, realCrimes=realCrimes,
                                              periodsAhead_list=periodsAhead_list, gridshape=gridshape, ignoreFirst=ignoreFirst, threshold=threshold, maxDist=maxDist, isModelEvaluation=isModelEvaluation)
                clusters, _, forecasts = pd.read_pickle(result_path)
                compute_resource_allocation(resource_indexes, 1, [gridshape], periodsAhead_list, ignoreFirst, [
                    threshold], 1, [method], lon_min, lon_max, lat_min, lat_max)
    fig, ax = plt.subplots(
        1, len(methods), figsize=(18, 5), sharey=True)
    plot_resource_allocation(
        ax, gridshapes, periodsAhead_list[0], thresholds, methods, ignoreFirst)
    os.makedirs(os.path.abspath("results/"), exist_ok=True)
    os.makedirs(os.path.abspath(
                "results/plot"), exist_ok=True)
    image_path = os.path.abspath(
        'results/plots/{}-week-ahead.png'.format(periodsAhead_list[0]))
    plt.savefig(image_path, dpi=300)
    with open(image_path, "rb") as imageFile:
        image_data = base64.b64encode(imageFile.read())
    response = HttpResponse(pd.io.json.dumps(image_data))
    response['Access-Control-Allow-Origin'] = '*'
    response.status_code = 200
    return response
