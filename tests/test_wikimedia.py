import urllib.request
import urllib.parse
import json

def get_wikimedia_image(query):
    # Wikimedia requires a proper User-Agent
    headers = {'User-Agent': 'LLMSpanishStudyApp/1.0 (contact@example.com)'}
    
    # Search for files in Commons
    search_url = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=File:" + urllib.parse.quote(query) + "&srnamespace=6&format=json"
    req = urllib.request.Request(search_url, headers=headers)
    
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read())
        results = data.get('query', {}).get('search', [])
        
        if not results:
            return None
            
        title = results[0]['title']
        
        # Get image info
        info_url = "https://commons.wikimedia.org/w/api.php?action=query&titles=" + urllib.parse.quote(title) + "&prop=imageinfo&iiprop=url&format=json"
        req_info = urllib.request.Request(info_url, headers=headers)
        resp_info = urllib.request.urlopen(req_info)
        info_data = json.loads(resp_info.read())
        
        pages = info_data.get('query', {}).get('pages', {})
        for page_id, page_info in pages.items():
            if 'imageinfo' in page_info:
                return page_info['imageinfo'][0]['url']
                
    except Exception as e:
        print("Error:", e)
    return None

print(get_wikimedia_image("autumn clipart"))
print(get_wikimedia_image("dog clipart"))
