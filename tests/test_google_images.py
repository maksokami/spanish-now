import urllib.request
import re
import urllib.parse

def search_google_image(query):
    url = "https://www.google.com/search?tbm=isch&q=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # Google often stores image URLs in the html inside somewhat predictable patterns, or base64 data
        # Let's try to find a standard http/https image url that ends in jpg/png
        matches = re.findall(r'(https?://[^"]+\.(?:jpg|png|jpeg))', html)
        if matches:
            for m in matches:
                if 'gstatic' not in m and 'google' not in m:
                    return m
            return matches[0]
    except Exception as e:
        return str(e)
    return "No image found"

print(search_google_image("clipart autumn"))
