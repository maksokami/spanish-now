from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import urllib.parse
import time

def search_startpage(query):
    options = Options()
    options.add_argument('--headless')
    driver = webdriver.Firefox(options=options)
    
    try:
        # Startpage might require initial visit to get cookies
        driver.get('https://www.startpage.com/')
        time.sleep(2)
        
        # Now visit image search
        url = "https://www.startpage.com/sp/search?query=" + urllib.parse.quote(query) + "&cat=images"
        driver.get(url)
        
        # Wait for images
        wait = WebDriverWait(driver, 10)
        # In Startpage, images are usually under div class "image-container" or similar, let's just find img tags that aren't icons
        imgs = wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, 'img')))
        
        for img in imgs:
            src = img.get_attribute('src')
            if src and src.startswith('http') and 'startpage' not in src:
                return src
        return "No external images found"
    except Exception as e:
        return str(e)
    finally:
        driver.quit()

print(search_startpage("clipart autumn"))
