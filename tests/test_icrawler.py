from icrawler.builtin import GoogleImageCrawler

class UrlStorageCrawler(GoogleImageCrawler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, downloader_threads=0, **kwargs)
        self.urls = []

    def save_task(self, task):
        if 'file_url' in task:
            self.urls.append(task['file_url'])
            
    def download(self, **kwargs):
        # Prevent actual download, we only need URLs
        pass

def get_google_url(query):
    crawler = UrlStorageCrawler(storage={'root_dir': '/tmp'})
    # We monkeypatch the downloader to just collect the urls. Actually save_task isn't enough, we can just intercept the queue.
    # icrawler has a task_queue where the parsed urls are put.
    crawler.crawl(keyword=query, max_num=1)
    # The tasks are in the task_queue but since we disabled downloader, they are just sitting there.
    # Let's see if we can get it from crawler.task_queue
    try:
        task = crawler.task_queue.get(timeout=2)
        if task and 'file_url' in task:
            return task['file_url']
    except:
        pass
    return "Not found"

print(get_google_url("clipart autumn"))
