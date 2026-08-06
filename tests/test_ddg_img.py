import requests
from bs4 import BeautifulSoup
import urllib.parse
import re

def search_ddg_image(query):
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    try:
        response = requests.get(url, headers=headers)
        # duckduckgo HTML search doesn't actually have image search tab in /html/.
        # Let's try duckduckgo lite or search for images explicitly.
        # Actually, DDG image search endpoint is /i.js, which duckduckgo_search uses and gets 403.
        # Let's check Yahoo image search! Yahoo is often much easier to scrape.
        pass
    except Exception as e:
        pass

def search_yahoo_image(query):
    url = "https://images.search.yahoo.com/search/images?p=" + urllib.parse.quote(query)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        # Yahoo images are in <li> with id="resitem-..." or <a> with data-rurl
        images = soup.find_all('img')
        for img in images:
            src = img.get('data-src') or img.get('src')
            if src and 'http' in src and 'yimg.com' not in src:
                return src
            if src and 'http' in src and 'yimg.com' in src and 'logo' not in src:
                # usually Yahoo caches thumbnails on yimg.com
                return src
    except Exception as e:
        return str(e)
    return "No image found"

print("Yahoo Autumn:", search_yahoo_image("clipart autumn"))
print("Yahoo Dog:", search_yahoo_image("clipart dog"))
