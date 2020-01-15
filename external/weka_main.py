import json
import os
import sys

import weka.core.jvm as jvm
from bson.objectid import ObjectId
from pymongo import MongoClient
from weka.classifiers import Classifier, FilteredClassifier
from weka.core.converters import Loader
from weka.core.dataset import Attribute, Instance, Instances
from weka.filters import Filter

os.environ["_JAVA_OPTIONS"] = "-Dfile.encoding=UTF-8"

if len(sys.argv) < 2:
    print("Article ID from MongoDB must be provided!")
    sys.exit()

article_id = ObjectId(sys.argv[1])

client = MongoClient('mongodb://localhost:27017/')
db = client["news-scraper"]
articles_collection = db.articles
article = articles_collection.find_one({"_id": article_id})

jvm.start(system_cp=True, packages=True, max_heap_size="512m")

# Train classifier

loader = Loader(classname="weka.core.converters.ArffLoader", options=["-charset", "UTF-8"])
train_data = loader.load_file(os.path.dirname(os.path.realpath(__file__)) + "/datasets/train.arff")
train_data.class_is_last()

string_to_word_vector_filter = Filter(classname="weka.filters.unsupervised.attribute.StringToWordVector")
cls = Classifier(classname="weka.classifiers.bayes.NaiveBayesMultinomial")

fc = FilteredClassifier()
fc.filter = string_to_word_vector_filter
fc.classifier = cls

fc.build_classifier(train_data)

# Create test data

class_att = Attribute.create_nominal("class", ["good", "neutral", "bad"])
str_att = Attribute.create_string("title")

test_dataset = Instances.create_instances(
    name="test_news_set",
    atts=[str_att, class_att],
    capacity=1
)

inst = Instance.create_instance([Instance.missing_value(), Instance.missing_value()])
test_dataset.add_instance(inst)
test_dataset.get_instance(0).set_string_value(0, article['processed']['title'])
test_dataset.class_is_last()

# Run classifier

article_instance = test_dataset.get_instance(0)
prediction = fc.classify_instance(article_instance)

article_type = article_instance.class_attribute.value(int(prediction))
if article_type is 'good' or 'neutral' or 'bad':
    articles_collection.update_one({
        "_id": article_id},
        {
            "$set": {
                "type": article_type,
            }})

result = {"id": str(article_id), "type": article_type}
print(json.dumps(result))

jvm.stop()
sys.exit()
