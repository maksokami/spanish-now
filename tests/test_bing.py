import urllib.request
import re
import urllib.parse
import json

def search_bing_image(query):
    url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # Bing uses class="mimg" or class="iusc" for image elements.
        # Inside class="iusc", there is a attribute m="{...}" which is JSON.
        matches = re.findall(r'm=\"({.*?})\"', html.replace('&quot;', '"'))
        for m in matches:
            try:
                data = json.loads(m)
                if 'murl' in data:
                    return data['murl']
            except:
                pass
    except Exception as e:
        return str(e)
    return "No image found"

print("Autumn:", search_bing_image("clipart autumn"))
print("Dog:", search_bing_image("clipart dog"))
