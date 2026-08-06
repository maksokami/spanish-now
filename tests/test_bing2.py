import urllib.request
import re
import urllib.parse
import json
from bs4 import BeautifulSoup

def search_bing_image(query):
    url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        # find img class mimg
        images = soup.find_all('img', class_='mimg')
        for img in images:
            src = img.get('src') or img.get('data-src')
            if src and 'http' in src:
                return src
    except Exception as e:
        return str(e)
    return "No image found"

print("Autumn:", search_bing_image("clipart autumn"))
print("Dog:", search_bing_image("clipart dog"))
