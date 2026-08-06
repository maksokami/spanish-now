import requests
from bs4 import BeautifulSoup
import urllib.parse

def search_ddg_image(query):
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        images = soup.find_all('img')
        for img in images:
            src = img.get('src')
            if src and src.startswith('//'):
                return "https:" + src
            elif src and src.startswith('http'):
                return src
    except Exception as e:
        print(str(e))
    return "No image found"

print(search_ddg_image("clipart autumn"))
