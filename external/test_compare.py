import sys

import cv2 as cv
import numpy as np
from bson.objectid import ObjectId
from pymongo import MongoClient

if len(sys.argv) < 3:
    print("Two article IDs from MongoDB must be provided!")
    sys.exit()

first_article_id = ObjectId(sys.argv[1])
second_article_id = ObjectId(sys.argv[2])

print("First ID of the article to compare: " + str(first_article_id))
print("Second ID of the article to compare: " + str(second_article_id))

client = MongoClient('mongodb://localhost:27017/')

db = client["news-scraper"]

articles_collection = db.articles
comparisons_collection = db.comparisons

first_article = articles_collection.find_one({"_id": first_article_id})
second_article = articles_collection.find_one({"_id": second_article_id})

first_images = first_article['images']
second_images = second_article['images']

methods = ["HISTCMP_CORREL", "HISTCMP_CHISQR", "HISTCMP_INTERSECT", "HISTCMP_BHATTACHARYYA"]

results = []

for f_image in first_images:
    for s_image in second_images:
        first_image_data = np.array(f_image["features"]["hog"]["values"], dtype=float)
        second_image_data = np.array(s_image["features"]["hog"]["values"], dtype=float)

        first_image_data = np.float32(first_image_data)
        second_image_data = np.float32(second_image_data)

        print("Comparing " + str(f_image["_id"]) + " with " + str(s_image["_id"]))

        result = {
            "firstImageId": f_image["_id"],
            "secondImageId": s_image["_id"],
            "data": {}
        }

        for index, comparison_method in enumerate(methods):
            compare = cv.compareHist(first_image_data, second_image_data, index)
            result["data"][comparison_method] = compare

        results.insert(len(results),result)

comparison = {
    "firstArticleId": first_article_id,
    "secondArticleId": second_article_id,
    "comparisons": results
}

x = comparisons_collection.insert_one(comparison)

print(comparison)
