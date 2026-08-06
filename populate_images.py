import json
import glob
import time
import urllib.parse
import re
from playwright.sync_api import sync_playwright

def get_startpage_image(page, keyword):
    try:
        url = "https://www.startpage.com/sp/search?query=" + urllib.parse.quote(keyword) + "&cat=images"
        page.goto(url, wait_until="domcontentloaded")
        
        # Wait for images to load
        page.wait_for_selector('img', timeout=10000)
        
        # Extract all image sources
        imgs = page.locator('img').all()
        for img in imgs:
            src = img.get_attribute('src')
            if src and src.startswith('http') and 'startpage' not in src:
                return src
    except Exception as e:
        print(f"Error fetching {keyword}: {e}")
    return None

def process_file(page, filepath):
    print(f"Processing {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    updated = False
    if 'data' in data and isinstance(data['data'], list):
        for item in data['data']:
            base_word = re.sub(r'[^a-zA-Z\s]', '', item.get('en', ''))
            raw_keyword = base_word.strip() + " clipart"
            print(f"Fetching image for: {raw_keyword}")
            
            url = get_startpage_image(page, raw_keyword)
            if url:
                item['imageUrl'] = url
                updated = True
            time.sleep(1) # delay to impersonate human
                
    if updated:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved {filepath}")

def main():
    with sync_playwright() as p:
        # Launch Chromium headless
        browser = p.chromium.launch(headless=True)
        # Impersonate human user agent
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Visit home page first to establish session/cookies
        try:
            page.goto('https://www.startpage.com/', wait_until="domcontentloaded")
            time.sleep(2)
        except:
            pass
        
        files = glob.glob('topics/**/*.json', recursive=True)
        for f in files:
            with open(f, 'r', encoding='utf-8') as file:
                try:
                    content = json.load(file)
                    if content.get('type') in ['flashcards', 'srs-flashcards']:
                        process_file(page, f)
                except Exception as e:
                    pass
        
        browser.close()

if __name__ == '__main__':
    main()
