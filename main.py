import requests
import urllib.request
import time
import re
from bs4 import BeautifulSoup

url = "https://www.zurnal24.si"
response = requests.get(url)

soup = BeautifulSoup(response.text, "html.parser")

for a in soup.find_all('a', href=True):
    if a['href'].startswith('/') and re.search(r'\d+$', a['href']):
        print(url + a['href'])
