from icrawler.builtin import GoogleImageCrawler

google_crawler = GoogleImageCrawler(storage={'root_dir': 'images'})
google_crawler.crawl(keyword='clipart autumn', max_num=1)
