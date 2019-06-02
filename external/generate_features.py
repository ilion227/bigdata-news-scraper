import sys
import urllib.request

import cv2 as cv
import math
import numpy as np
from bitstring import BitArray
from bson.objectid import ObjectId
from pymongo import MongoClient

CELL_SIZE = (16, 16)
BLOCK_SIZE = (2, 2)
RESIZE_DIMENSIONS = (64, 128)
DISTANCE = 2


def calculate_lbp(img, shape):
    img = cv.resize(img, RESIZE_DIMENSIONS)

    new_img = img.copy()
    height, width = img.shape
    bins = 256

    histograms = []
    for y in range(0, height, CELL_SIZE[1]):
        for x in range(0, width, CELL_SIZE[0]):

            local_histogram = np.zeros(bins)
            for j in range(y, y + CELL_SIZE[1]):
                for i in range(x, x + CELL_SIZE[0]):
                    try:
                        center = img[j, i]

                        values = [img[j - 1, i - 1], img[j, i - 1],
                                  img[j + 1, i - 1], img[j + 1, i],
                                  img[j + 1, i + 1],
                                  img[j, i + 1], img[j - 1, i + 1],
                                  img[j - 1, i]]

                        binary = []
                        for val in values:
                            if val >= center:
                                binary.append(1)
                            else:
                                binary.append(0)

                        # Convert binary to integer value
                        binary = np.array(binary)
                        bit_array = BitArray(binary)
                        result = bit_array.uint

                        new_img[j, i] = result

                        local_histogram[result] += 1
                    except IndexError:
                        pass

            squared = np.square(local_histogram)
            squared = squared + math.pow(0.0001, 2)
            l2_norm = np.sum(squared)

            normalized_local_histogram = local_histogram / l2_norm
            histograms.append(normalized_local_histogram)

    return {
        "cell_dimensions": {
            "x": CELL_SIZE[0],
            "y": CELL_SIZE[1]
        },
        "block_dimensions": {
            "x": BLOCK_SIZE[0],
            "y": BLOCK_SIZE[1]
        },
        "n_bins": bins,
        "img_dimensions": {
            "x": shape[1],
            "y": shape[0]
        },
        "resized_img_dimensions": {
            "x": RESIZE_DIMENSIONS[0],
            "y": RESIZE_DIMENSIONS[1]
        },
        "values": np.concatenate(histograms).ravel().tolist()
    }


def calculate_lbp_uniform(img, shape):
    img = cv.resize(img, RESIZE_DIMENSIONS)

    new_img = img.copy()
    height, width = img.shape
    bins = 59

    histograms = []
    for y in range(0, height, CELL_SIZE[1]):
        for x in range(0, width, CELL_SIZE[0]):

            local_histogram = np.zeros(bins)
            for j in range(y, y + CELL_SIZE[1]):
                for i in range(x, x + CELL_SIZE[0]):
                    changes = 0
                    try:
                        center = img[j, i]

                        values = [img[j - 1, i - 1], img[j, i - 1],
                                  img[j + 1, i - 1], img[j + 1, i],
                                  img[j + 1, i + 1],
                                  img[j, i + 1], img[j - 1, i + 1],
                                  img[j - 1, i]]

                        last = []
                        binary = []
                        for val in values:
                            if val >= center:
                                binary.append(1)
                            else:
                                binary.append(0)
                            last.append(binary[-1])
                            if len(last) > 1 and last[-1] != last[-2]:
                                changes = changes + 1

                        # Convert binary to integer value
                        binary = np.array(binary)
                        bit_array = BitArray(binary)
                        result = bit_array.uint
                        if changes <= 2:
                            local_histogram[result] += 1
                            new_img[j, i] = result
                        else:
                            # Last bin is for non uniform values
                            local_histogram[bins - 1] += 1
                            new_img[j, i] = bins - 1

                    except IndexError:
                        pass

            squared = np.square(local_histogram)
            squared = squared + math.pow(0.0001, 2)
            l2_norm = np.sum(squared)

            normalized_local_histogram = local_histogram / l2_norm
            histograms.append(normalized_local_histogram)

    return {
        "cell_dimensions": {
            "x": CELL_SIZE[0],
            "y": CELL_SIZE[1]
        },
        "block_dimensions": {
            "x": BLOCK_SIZE[0],
            "y": BLOCK_SIZE[1]
        },
        "n_bins": bins,
        "img_dimensions": {
            "x": shape[1],
            "y": shape[0]
        },
        "resized_img_dimensions": {
            "x": RESIZE_DIMENSIONS[0],
            "y": RESIZE_DIMENSIONS[1]
        },
        "values": np.concatenate(histograms).ravel().tolist()
    }


def calculate_lbp_distance(img, shape, d):
    img = cv.resize(img, RESIZE_DIMENSIONS)

    new_img = img.copy()
    height, width = img.shape
    bins = 256

    histograms = []
    for y in range(0, height, CELL_SIZE[1]):
        for x in range(0, width, CELL_SIZE[0]):
            local_histogram = np.zeros(bins)
            for j in range(y, y + CELL_SIZE[1]):
                for i in range(x, x + CELL_SIZE[0]):
                    next_index = d
                    comparisons = 0

                    binary = []

                    try:
                        while comparisons < 8:
                            values = [img[j - 1, i - 1], img[j, i - 1],
                                      img[j + 1, i - 1], img[j + 1, i],
                                      img[j + 1, i + 1],
                                      img[j, i + 1], img[j - 1, i + 1],
                                      img[j - 1, i]]

                            while next_index >= len(values):
                                next_index -= len(values)
                            center = values[next_index]

                            val = values[comparisons]

                            if val >= center:
                                binary.append(1)
                            else:
                                binary.append(0)

                            comparisons += 1
                            next_index = comparisons + d

                        # Convert binary to integer value
                        binary = np.array(binary)
                        bit_array = BitArray(binary)
                        result = bit_array.uint

                        new_img[j, i] = result

                        local_histogram[result] += 1

                    except IndexError:
                        pass

            squared = np.square(local_histogram)
            squared = squared + math.pow(0.0001, 2)
            l2_norm = np.sum(squared)

            normalized_local_histogram = local_histogram / l2_norm
            histograms.append(normalized_local_histogram)

    return {
        "distance": d,
        "cell_dimensions": {
            "x": CELL_SIZE[0],
            "y": CELL_SIZE[1]
        },
        "block_dimensions": {
            "x": BLOCK_SIZE[0],
            "y": BLOCK_SIZE[1]
        },
        "n_bins": bins,
        "img_dimensions": {
            "x": shape[1],
            "y": shape[0]
        },
        "resized_img_dimensions": {
            "x": RESIZE_DIMENSIONS[0],
            "y": RESIZE_DIMENSIONS[1]
        },
        "values": np.concatenate(histograms).ravel().tolist()
    }


def histogram_oriented_gradients(img, shape):
    img = cv.resize(img, RESIZE_DIMENSIONS)

    # Gradient and angle
    height, width = img.shape

    gx = cv.Sobel(img, cv.CV_32F, 1, 0, ksize=1)
    gy = cv.Sobel(img, cv.CV_32F, 0, 1, ksize=1)

    a = np.zeros((height, width))
    g = np.zeros((height, width))

    bins = 9

    for x in range(0, height):
        for y in range(0, width):
            g[x, y] = math.sqrt(math.pow(gx[x, y], 2) + math.pow(gy[x, y], 2))
            a[x, y] = math.degrees(math.atan2(gy[x, y], gx[x, y]))

    hogs = np.zeros((int(height / CELL_SIZE[0]),
                     int(width / CELL_SIZE[1]), bins))

    row = 0
    for y in range(0, height, CELL_SIZE[1]):
        col = 0
        for x in range(0, width, CELL_SIZE[0]):
            gradients_cell = g[y:y + CELL_SIZE[1], x:x + CELL_SIZE[0]]
            angles_cell = a[y:y + CELL_SIZE[1], x:x + CELL_SIZE[0]]
            angles_cell = np.absolute(angles_cell)

            bin_size = 180 // bins
            hog = np.zeros(bins)
            for i in range(0, CELL_SIZE[0]):
                for j in range(0, CELL_SIZE[1]):
                    gradient = gradients_cell[i, j]
                    angle = angles_cell[i, j]

                    left = math.floor(angle / bin_size)
                    right = math.ceil(angle / bin_size)
                    value = float(angle / bin_size)

                    l_value = float(value - left)
                    r_value = float(right - value)

                    if right >= bins:
                        right -= bins

                    if left >= bins:
                        left -= bins

                    if value >= bins:
                        value -= bins

                    if left == right:
                        hog[int(value)] += gradient
                    elif float(value - left) > 0.5:
                        hog[left] += l_value * gradient
                        hog[right] += r_value * gradient
                    else:
                        hog[right] += l_value * gradient
                        hog[left] += r_value * gradient

            hog = hog / (CELL_SIZE[0] * CELL_SIZE[1])

            hogs[row][col] = hog.flatten()
            col = col + 1
        row = row + 1

    features = []

    for j in range(0, hogs.shape[0]):
        for i in range(0, hogs.shape[1]):
            local_hogs = hogs[j:j + BLOCK_SIZE[0], i:i + BLOCK_SIZE[1]]
            if (i * CELL_SIZE[0] + CELL_SIZE[0] * 2 > width or j *
                    CELL_SIZE[1] + CELL_SIZE[
                        1] * 2 > height):
                continue

            squared = np.square(local_hogs)
            squared = squared + math.pow(0.0001, 2)
            l2_norm = np.sum(squared)

            normalized_hogs = local_hogs / l2_norm

            features.append(normalized_hogs.flatten())

    return {
        "cell_dimensions": {
            "x": CELL_SIZE[0],
            "y": CELL_SIZE[1]
        },
        "block_dimensions": {
            "x": BLOCK_SIZE[0],
            "y": BLOCK_SIZE[1]
        },
        "n_bins": bins,
        "img_dimensions": {
            "x": shape[1],
            "y": shape[0]
        },
        "resized_img_dimensions": {
            "x": RESIZE_DIMENSIONS[0],
            "y": RESIZE_DIMENSIONS[1]
        },
        "values": np.concatenate(features).ravel().tolist()
    }


if len(sys.argv) < 2:
    print("Article's ID from MongoDB must be provided!")
    sys.exit()

article_id = ObjectId(sys.argv[1])

print("ID of the article to process images: " + str(article_id))

client = MongoClient('mongodb://localhost:27017/')

db = client["news-scraper"]

articles_collection = db.articles

article = articles_collection.find_one({"_id": article_id})
images = article['images']

for image in images:
    try:
        url = image['url']
        if len(url) <= 0:
            continue

        print("Processing", url)

        response = urllib.request.urlopen(url)
        npData = np.asarray(bytearray(response.read()), dtype="uint8")
        image_data = cv.imdecode(npData, cv.IMREAD_GRAYSCALE)

        hog_data = histogram_oriented_gradients(image_data, image_data.shape)
        lbp_data = calculate_lbp(image_data, image_data.shape)
        lbp_u_data = calculate_lbp_uniform(image_data, image_data.shape)
        lbp_d_data = calculate_lbp_distance(image_data, image_data.shape, DISTANCE)

        articles_collection.update_one({
            "_id": article_id,
            "images": {"$elemMatch": {"_id": image["_id"]}}}, {
            "$set": {
                "images.$.generatedFeatures": True,
                "images.$.features.hog": hog_data,
                "images.$.features.lbp": lbp_data,
                "images.$.features.lbp_u": lbp_u_data,
                "images.$.features.lbp_d": lbp_d_data,
            }})

    except:
        print("Something failed...")
        pass

print("Article's images processed!")
