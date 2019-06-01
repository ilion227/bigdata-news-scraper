import io
import requests
import json

from bs4 import BeautifulSoup

added = 1
found = 1
data = []
subdata = []
stopnja = 3
str_stopnja = str(stopnja)
tr_st = 1
str_tr_st = str(tr_st)
url = "http://www.os-livada.si/"
data.append(url)
subdata.append(url)
dolzina = 0


def get_links(link):
    global added
    global found
    url = link
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    for a in soup.find_all('a', href=True):
        skok = 0
        found += 1
        if a['href'].startswith('/'):
            url = link + a['href']
        elif a['href'].startswith('http'):
            url = a['href']
        else:
            url = 0
        match = 0
        for povezava in subdata:
            if url == povezava:
                match += 1
                break
        # if a['href'].startswith('#') or a['href'].startswith('mailto'):
        if url == 0:
            skok = 1
        if match == 0 and skok == 0:
            subdata.append(url)
            added = added + 1
            print("Povezava " + str(added))


while tr_st <= stopnja:
    print(str_tr_st + ". level: ")
    for link in data[dolzina:]:
        get_links(link)
    dolzina = len(data)
    for link in subdata[dolzina:]:
        data.append(link)
    found_str = str(found)
    added_str = str(added)
    print(str_tr_st + ". level Found " + found_str + ", added " + added_str + ".")
    tr_st += 1
    str_tr_st = str(tr_st)


with io.open("data.json", "w", encoding='utf8') as datafile:
    json.dump(data, datafile, ensure_ascii=False)

found_str = str(found)
added_str = str(added)

print("Done." + str_stopnja + " levels. Found " + found_str + ", added " + added_str + ".")


