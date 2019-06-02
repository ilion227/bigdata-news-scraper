import sys

from bson.objectid import ObjectId
from pymongo import MongoClient

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
    print("Processing", images)
