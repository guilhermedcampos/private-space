# Local server for testing and demos: python3 serve.py, then open http://localhost:8765
# Tells the browser never to cache, so edits always show up after a normal reload.
import http.server
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


http.server.ThreadingHTTPServer(("", 8765), NoCacheHandler).serve_forever()
