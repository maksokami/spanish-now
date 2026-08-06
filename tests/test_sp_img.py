from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    page = context.new_page()
    page.goto('https://www.startpage.com/sp/search?query=clipart+red&cat=images', wait_until="domcontentloaded")
    
    try:
        page.wait_for_selector('img', timeout=5000)
        imgs = page.locator('img').all()
        urls = [img.get_attribute('src') for img in imgs]
        print(urls)
    except Exception as e:
        print(e)
    
    browser.close()
