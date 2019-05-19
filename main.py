import io

import requests
import json
import re
from bs4 import BeautifulSoup

url = "https://www.zurnal24.si"
response = requests.get(url)
data = []

soup = BeautifulSoup(response.content, "html.parser")

ct = 1
for a in soup.find_all('a', href=True):
    if a['href'].startswith('/') and re.search(r'\d+$', a['href']):
        ct = ct + 1
        print("Article " + str(ct))
        suburl = url + a['href']
        sub_soup = BeautifulSoup(requests.get(suburl).content, "html.parser")
        title = sub_soup.find('h1', {"class": "article__title"}).text
        authors = []
        for author in sub_soup.find('div', {"class": "article__authors"}).find_all("a"):
            authors.append(author.text.strip())
        excerpt = sub_soup.find('div', {"class": "article__leadtext"}).text.strip()
        data.append((title, excerpt, authors))

with io.open("data.json", "w", encoding='utf8') as datafile:
    json.dump(data, datafile, ensure_ascii=False)

print("Done.")
