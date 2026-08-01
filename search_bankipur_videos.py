import json
import logging
import re
from typing import List, Dict
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
}

queries = [
    "Bankipur election exit poll",
    "Bankipur election ground report",
    "Bankipur public opinion",
    "बांकीपुर चुनाव एग्जिट पोल",
    "बांकीपुर विधानसभा एग्जिट पोल",
    "बांकीपुर पब्लिक ओपिनियन",
    "Bankipur election 30 July",
    "Bankipur voting exit poll",
    "Patna Bankipur election",
    "बांकीपुर जनता का मूड",
    "बांकीपुर उपचुनाव एग्जिट पोल",
    "Bankipur by election ground report",
    "Bankipur exit poll 2026",
    "बांकीपुर वोटिंग के बाद जनता",
    "Bankipur candidate interview",
    "Bankipur Prashant Kishor exit poll",
    "Bankipur Nitin Nabin election",
    "बांकीपुर चुनाव परिणाम",
    "Bankipur news exit poll"
]

all_videos = {}

ydl_opts = {
    'extract_flat': True,
    'skip_download': True,
    'quiet': True,
    'http_headers': BROWSER_HEADERS
}

for query in queries:
    search_url = f"ytsearch50:{query}"
    logging.info(f"Searching query: {query}")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            res = ydl.extract_info(search_url, download=False)
            entries = res.get('entries', [])
            for entry in entries:
                if not entry:
                    continue
                vid = entry.get('id')
                if not vid:
                    continue
                if vid not in all_videos:
                    all_videos[vid] = {
                        "id": vid,
                        "title": entry.get("title", ""),
                        "channel": entry.get("uploader") or entry.get("channel") or "",
                        "url": f"https://www.youtube.com/watch?v={vid}",
                        "duration": entry.get("duration"),
                        "view_count": entry.get("view_count"),
                        "query_found": query
                    }
        except Exception as e:
            logging.error(f"Error searching {query}: {e}")

print(f"Total unique raw search results fetched: {len(all_videos)}")

# Save raw results
with open("raw_search_results.json", "w", encoding="utf-8") as f:
    json.dump(list(all_videos.values()), f, ensure_ascii=False, indent=2)
