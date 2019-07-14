import numpy as np
import pandas as pd
from datetime import date
from datetime import timedelta
import os
import pickle
import math
from pathlib import Path
import matplotlib
matplotlib.use('TkAgg')
from matplotlib import pyplot as plt
from sklearn.metrics import mean_squared_error
# count the amount of weeks elapsed since the begining of the database
from math import radians, cos, sin, asin, sqrt
import base64
from ..fwdfiles.resourceAllocation_functions import fixResourceAvailable

def getBorderCordinates(lon_max, lon_min, lat_max, lat_min, gridshape, i, j):
    """Given the cell number i and j, return the borders of the cell. Each
    border is represented as a tuple (lon1, lat1, lon2, lat2). The borders
    of a cell is in a list of

    Arguments:
        lon_max {float} -- maximum longitude of the area
        lon_min {float} -- minimum longitude of the area
        lat_max {float} -- maximum latitude of the area
        lat_min {float} -- minimum latitude of the area
        gridshape {tuple(2)} -- tuple(num_of_columns, num_of_rows)
        i {int} -- the row index of the cell
        j {int} -- the column index of the cell
    """
    lon_unit = (lon_max - lon_min) / gridshape[0]
    lat_unit = (lat_max - lat_min) / gridshape[1]

    # point_0_0: upperleft corner. The first 0 is row. The second 0 is column.
    # assume the larger the lon is, more right it goes
    point_0_0 = tuple((lon_min + lon_unit * j, lat_min +
                       lat_unit * (gridshape[1] - i)))
    point_0_1 = tuple((lon_min + lon_unit*(j + 1), lat_min +
                       lat_unit * (gridshape[1] - i)))
    point_1_0 = tuple((lon_min + lon_unit * j, lat_min +
                       lat_unit * (gridshape[1] - i - 1)))
    point_1_1 = tuple((lon_min + lon_unit*(j + 1), lat_min +
                       lat_unit * (gridshape[1] - i - 1)))
    # each border is written as tuple(lon1, lat1, lon2, lat2) such that
    # either lat2 is "lower" than lat1 or lon2 is on the "right" of lon1
    return [tuple((point_0_0[0], point_0_0[1], point_0_1[0], point_0_1[1])),
            tuple((point_0_0[0], point_0_0[1], point_1_0[0], point_1_0[1])),
            tuple((point_0_1[0], point_0_1[1], point_1_1[0], point_1_1[1])),
            tuple((point_1_0[0], point_1_0[1], point_1_1[0], point_1_1[1]))]


def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371
    return c * r


def savePredictions(clusters, realCrimes, forecasts, method,
                    gridshape, ignoreFirst,
                    periodsAhead, threshold, maxDist):
    # save it to disk
    os.makedirs(os.path.abspath("results/"), exist_ok=True)
    os.makedirs(os.path.abspath("results/{}".format(method)), exist_ok=True)
    fileName = os.path.abspath(
        "results/{}/{}_predictions_grid({},{})_ignore({})_ahead({})_threshold({})_dist({}).pkl".format(
            method, method, *gridshape, ignoreFirst, periodsAhead, threshold, maxDist
        )
    )
    output = open(fileName, 'wb')
    pickle.dump((clusters, realCrimes, forecasts), output)
    output.close()
    return fileName

def saveParameters(orders, seasonal_orders, method,
                   gridshape, cluster_id, ignoreFirst,
                   threshold, maxDist):
    # save it to disk
    os.makedirs(os.path.abspath("parameters/"), exist_ok=True)
    os.makedirs(os.path.abspath("parameters/{}".format(method)), exist_ok=True)
    fileName = os.path.abspath(
        "parameters/{}/{}_parameters_grid({},{})_cluster({})_ignore({})_threshold({})_dist({}).pkl".format(
            method, method, *gridshape, cluster_id, ignoreFirst, threshold, maxDist
        )
    )
    output = open(fileName, 'wb')
    pickle.dump((orders, seasonal_orders), output)
    output.close()
    return fileName


def getAreaFromLatLon(lon1, lon2, lat1, lat2):
    return (math.pi / 180) * 10 ** 6 * math.fabs(math.sin(lat1) - math.sin(lat2)) * math.fabs(lon1-lon2)


def getIfParametersExists(method, gridshape, cluster_id, ignoreFirst, threshold, maxDist):
    if Path("parameters/{}/{}_parameters_grid({},{})_cluster({})_ignore({})_threshold({})_dist({}).pkl".format(method, method, *gridshape, cluster_id, ignoreFirst, threshold, maxDist)).is_file():
        return pd.read_pickle("parameters/{}/{}_parameters_grid({},{})_cluster({})_ignore({})_threshold({})_dist({}).pkl".format(method, method, *gridshape, cluster_id, ignoreFirst, threshold, maxDist))
    return None


def plotTimeSeries(df, testPredict, file_path):
    testPredict.index = df[-len(testPredict):].index
    # plot baseline and predictions
    plt.plot(df)
    plt.plot(testPredict)
    plt.savefig(file_path)
    plt.close()


def compute_resource_allocation(resource_indexes, cell_coverage_units, gridshapes, periodsAhead_list, ignoreFirst, thresholds, dist, methods, lon_min, lon_max, lat_min, lat_max):
    for periodsAhead in periodsAhead_list:
        os.makedirs(os.path.abspath("results/"), exist_ok=True)
        os.makedirs(os.path.abspath(
            "results/resource_allocation"), exist_ok=True)
        for method in methods:
            for threshold in thresholds:
                for gridshape in gridshapes:
                    print('output')
                    output_filename = os.path.abspath("results/resource_allocation/{}_{}_({}x{})({})_{}_ahead.pkl".format(
                        'LA' if ignoreFirst == 104 else 'USC', method, gridshape[0], gridshape[1], threshold, periodsAhead))
                    file = os.path.abspath("results/{}/{}_predictions_grid({},{})_ignore({})_ahead({})_threshold({})_dist({}).pkl".format(
                        method, method, gridshape[0], gridshape[1], ignoreFirst, periodsAhead, threshold, dist))
                    clusters, realCrimes, forecasts = pd.read_pickle(file)
                    
                    # this step is added specifically for the django prediction tool
                    # periodsAhead_list contains only one element in the app
                    forecasts = forecasts[: - periodsAhead_list[0]]
                    
                    unit_area = getAreaFromLatLon(
                        lon1=lon_min, lon2=lon_max, lat1=lat_min, lat2=lat_max) / (gridshape[0] * gridshape[1])
                    scores = fixResourceAvailable(resource_indexes, forecasts, realCrimes, clusters, cell_coverage_units, unit_area).rename(
                        "{} ({}x{})({})".format(method, gridshape[0], gridshape[1], threshold))
                    with open(output_filename, "wb") as ofile:
                        pickle.dump(scores, ofile)
                    return output_filename