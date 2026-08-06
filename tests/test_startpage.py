import requests
from bs4 import BeautifulSoup
import urllib.parse
import re

def search_startpage(query):
    # Startpage usually requires a POST request with a specific token, but sometimes GET works on some endpoints.
    # Let's try a simple GET with realistic headers.
    url = "https://www.startpage.com/sp/search"
    params = {
        'query': query,
        'cat': 'images'
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
    }
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print("Status Code:", response.status_code)
        if response.status_code == 200:
            html = response.text
            # Print a snippet to see if we got a bot challenge or actual results
            print("Snippet:", html[:200])
            # Startpage images are usually embedded in a specific JSON or have specific classes
            # Let's look for standard image urls
            matches = re.findall(r'(https?://[^"]+\.(?:jpg|png|jpeg))', html)
            if matches:
                # filter out startpage assets
                valid = [m for m in matches if 'startpage' not in m]
                return valid[0] if valid else "Only startpage assets found"
            return "No image URLs found in HTML"
        return "Failed with status " + str(response.status_code)
    except Exception as e:
        return str(e)

print(search_startpage("clipart autumn"))
