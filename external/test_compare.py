import json

import cv2 as cv
import numpy as np

base_values = None
test1_values = None
data_values = None

with open('base/hog/hog_features.json') as json_file:
    data = json.load(json_file)
    base_values = np.array(data['values'], dtype=float)
with open('test1/hog/hog_features.json') as json_file:
    data = json.load(json_file)
    test1_values = np.array(data['values'], dtype=float)
with open('data/hog/hog_features.json') as json_file:
    data = json.load(json_file)
    data_values = np.array(data['values'], dtype=float)

base_values = np.float32(base_values)
test1_values = np.float32(test1_values)
data_values = np.float32(data_values)

for compare_method in range(4):
    base_base = cv.compareHist(base_values, base_values, compare_method)
    base_test1 = cv.compareHist(base_values, test1_values, compare_method)
    base_test2 = cv.compareHist(base_values, data_values, compare_method)
    print('Method:', compare_method,
          'Perfect, Base-Test(1), Data-Test(2) :')
    print(base_base, '/', base_test1, '/', base_test2)
