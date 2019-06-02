import io
import requests
import json

from bs4 import BeautifulSoup

added = 1
found = 1
data = []
subdata = []
level = 2
str_level = str(level)
tr_st = 1
str_tr_st = str(tr_st)
url = "https://www.zurnal24.si/"
data.append(url)
subdata.append(url)
length = 0


def get_links(link):
    global added
    global found
    url = link
    response = requests.get(url) #get html contents of url
    soup = BeautifulSoup(response.content, "html.parser")
    for a in soup.find_all('a', href=True): # for every link in the code that we go do:
        skok = 0
        found += 1
        if a['href'].startswith('/'):
            url = link + a['href']
        elif a['href'].startswith('http'): # only take link if it starts with http or /
            url = a['href']
        else:
            url = 0
        match = 0
        for povezava in subdata: # check if link already exists in the added links
            if url == povezava:
                match += 1
                break
        if url == 0:
            skok = 1
        if match == 0 and skok == 0: # if the link doesnt exist and its http or / then add it to subdata
            subdata.append(url)
            added = added + 1
            print("Link " + str(added))


while tr_st <= level: # while loop untill we reach the depth we set
    print(str_tr_st + ". level: ")
    for link in data[length:]: # goes through the data array and gets the links for each. on the next loop it starts where it left off so we don't waste time
        get_links(link)
    length = len(data)
    for link in subdata[length:]: # after the loop is done we add the inks we got to the main links. this is done after so we don't constantly lengthen the array while in the loop thus potentially creating an infinite loop
        data.append(link)
    found_str = str(found)
    added_str = str(added)
    print(str_tr_st + ". level. Found " + found_str + ", added " + added_str + ".") # output of how many links we found and how many we actually added
    tr_st += 1
    str_tr_st = str(tr_st) # increase depth by one and also turn it into string so we can output it


with io.open("data.json", "w", encoding='utf8') as datafile: # when we finished getting all the links we want, we write them to file data.json
    json.dump(data, datafile, ensure_ascii=False)

found_str = str(found)
added_str = str(added)

print("Done." + str_level + " levels. Found " + found_str + ", added " + added_str + ".") # at the end we print done so we know the code finished and we output the final result.


