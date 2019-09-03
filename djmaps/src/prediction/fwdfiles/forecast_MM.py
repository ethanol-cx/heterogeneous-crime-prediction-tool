import pandas as pd
import numpy as np
from pmdarima import auto_arima
import sklearn.model_selection as ms
import statsmodels.api as sm
from .general_functions import savePredictions, saveParameters, getIfParametersExists
# Compute predictions using Seasonal Moving Average Model


def dynamic_ma_predictions(df, look_back, start, end):
    results = np.zeros(end - start)
    window = np.array(df[start-look_back:start])
    for i in range(start, end):
        results[i-start] = window.sum() * 1.0 / look_back
        window = np.append(window[1:], [results[i-start]])
    return results

# `isModelEvaluation` is a temporary solution for predicting outside of test data / actual prediction. This is due to the difference below:
# In model evaluation, the regression is: given  t[i-periodsAhead-lookback+1:i-periodsAhead+1], predict t[i]
# In actual prediction, the regression is: given t[i-periodsAhead-lookback+1:i-periodsAhead+1], predict t[i-periodsAhead+1:i+1]


def forecast_MM(method, clusters, realCrimes, periodsAhead_list, gridshape, ignoreFirst, threshold, maxDist, isModelEvaluation, modelName=''):
    print("Starting Predictions_{}".format(method))
    cluster = clusters['Cluster']
    cluster_size = len(cluster.keys())
    cluster_cntr = -1
    periodsAhead_cntr = -1
    test_size = 0
    if isModelEvaluation:
        # this step is added specifically for the django prediction tool
        # periodsAhead_list contains only one element in the app
        test_size = len(next(iter(realCrimes.values()))) // 3
    else:
        # for the django prediction tool, predicts only the future data points (first set it to 0 for train/test split)
        test_size = periodsAhead_list[0]
    forecasted_data = np.zeros(
        (len(periodsAhead_list), cluster_size, test_size))
    for c in cluster.values():
        print("Predicting cluster {} with threshold {} using {}".format(
            c, threshold, method))
        cluster_cntr += 1

        df = list(realCrimes['C{}_Crimes'.format(c)].values())
        # train test split
        train = df[:-test_size]
        if not isModelEvaluation:
            train = df
        if sum(train) < 2:
            continue

        look_back = 3

        # for each predict horizon - `periodsAhead`, we perform rolling time series prediction with different window sizes
        # Note: the the `start` and the `end` defines the window and splits the observation and the "y_test"
        for periodsAhead in periodsAhead_list:
            print(method, threshold, c, periodsAhead)
            periodsAhead_cntr += 1
            predictions = np.zeros(test_size)
            for i in range(test_size):
                pred = dynamic_ma_predictions(
                    df, look_back, i+len(train)-periodsAhead, i+len(train))
                if isModelEvaluation:
                    predictions[i] = pred[-1]
                else:
                    predictions = pred
                    break
                # history.append(pd.Series(test[i]), ignore_index=True)

            # apply the assumption that all predictions should be non-negative
            predictions = [x if x >= 0 else 0 for x in predictions]

            # store the prediction to the corresponding column `periodsAhead_cntr` and `cluster_cntr`
            forecasted_data[periodsAhead_cntr][cluster_cntr] = predictions

        # reset the periodsAhead_cntr
        periodsAhead_cntr = -1

    # store the prediction
    for i in range(len(periodsAhead_list)):
        periodsAhead = periodsAhead_list[i]
        forecasts = pd.DataFrame(data=forecasted_data[i].T, columns=['C{}_Forecast'.format(c)
                                                                     for c in cluster.values()])
        # this step is added specifically for the django prediction tool
        # periodsAhead_list contains only one element in the app
        # This didn't update the index because it is slightly more complicated to 'extend' the date index by test_size.
        # However, if this were to be done, it should take the value of: `df[-test_size + periodsAhead[0]:].index.append([<the future dates>]).`
        # forecasts.index = df[-test_size:].index
        return savePredictions(clusters, realCrimes, forecasts, method,
                               gridshape, ignoreFirst, periodsAhead, threshold, maxDist)
