from bs4 import BeautifulSoup
from urllib.request import urlopen
import re
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["Web-scrapping"]

mycol = mydb["Stran"]
url = "https://24ur.com"
try:
   page = urlopen(url)
except:
   print("Error opening the URL")

#url, iz katerega bomo izhajali
html_page = urlopen(url)
#dobimo html strani
soup = BeautifulSoup(html_page,"html.parser")
links = []
zapisi = []

#Vsak link, ki je na strani dodamo v array links
for link in soup.findAll('a', attrs={'href': re.compile("^http://")}):
    links.append(link.get('href'))
    print(link)

#for link in soup.findAll('h2'):
 #   print(link)
#print(links)

slike = []
html = urlopen(url)
bs = BeautifulSoup(html, 'html.parser')
images = bs.find_all('img', {'src':re.compile('.jpg')})
for image in images:
    slike.append(image['src'])
#--------------------------------------------------
soup = BeautifulSoup(page, 'lxml')

#print(soup.findAll('p'))
vsebina = "".join([p.text for p in soup.find_all("p")])
#print(vsebina)

#print(slike)

#v podatkovno bazo dodam vse linke in slike v arrayu
mydict = { "URL":url, "Linki":links, "Slike": slike, "Vsebina":vsebina }
x = mycol.insert_one(mydict)


