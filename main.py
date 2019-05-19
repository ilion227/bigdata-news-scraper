import requests
import urllib.request
import time
from bs4 import BeautifulSoup

url = "https://www.zurnal24.si/"
response = requests.get(url)

soup = BeautifulSoup(response.text, "html.parser")
a_tags = soup.findAll('a')
print(a_tags)