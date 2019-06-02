import sys
import pprint
from pymongo import MongoClient

if len(sys.argv) < 2:
    print("Article's ID from MongoDB must be provided!")
    sys.exit()

article_id = sys.argv[1]

print("ID of the article to process images: " + article_id)

client = MongoClient('mongodb://localhost:27017/')

db = client["news-scraper"]


articles_collection = db.articles
pprint.pprint(articles_collection.find_one())