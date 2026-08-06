import requests
import re
import urllib.parse
import json

def search_google_image(query):
    url = "https://www.google.com/search?tbm=isch&q=" + urllib.parse.quote(query)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers)
        html = response.text
        # Extract URLs from AF_initDataCallback
        matches = re.findall(r'AF_initDataCallback\(\{key:\s*\'ds:1\'.*?data:(.*?)\}\);', html, re.S)
        if matches:
            data = matches[0]
            # find all http... urls that look like images
            urls = re.findall(r'\"(https?://[^\"]+?\.(?:jpg|png|jpeg|webp))\"', data)
            if urls:
                # return the first valid image
                for u in urls:
                    if 'gstatic' not in u and 'encrypted-tbn0' not in u:
                        return u
                return urls[0]
    except Exception as e:
        return str(e)
    return "No image found"

print(search_google_image("clipart autumn"))
