import json
import logging
from typing import List, Dict
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

with open("raw_search_results.json", "r", encoding="utf-8") as f:
    raw_list = json.load(f)

print(f"Total raw candidates found: {len(raw_list)}")

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
}

ydl_opts = {
    'skip_download': True,
    'quiet': True,
    'http_headers': BROWSER_HEADERS
}

detailed_videos = []

# Fetch metadata in batches or fast loop
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    for idx, item in enumerate(raw_list):
        url = item['url']
        try:
            info = ydl.extract_info(url, download=False)
            upload_date = info.get("upload_date", "") # YYYYMMDD
            title = info.get("title", item.get("title", ""))
            channel = info.get("uploader") or info.get("channel") or item.get("channel", "")
            duration = info.get("duration", 0)
            view_count = info.get("view_count", 0)
            
            # Format upload date as YYYY-MM-DD
            formatted_date = ""
            if upload_date and len(upload_date) == 8:
                formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
            else:
                formatted_date = upload_date

            video_entry = {
                "id": info.get("id", item["id"]),
                "title": title,
                "channel": channel,
                "upload_date": upload_date,
                "formatted_date": formatted_date,
                "duration_seconds": duration,
                "duration_formatted": f"{duration//60}m {duration%60}s" if duration else "N/A",
                "view_count": view_count,
                "url": url,
                "description": (info.get("description") or "")[:300]
            }
            detailed_videos.append(video_entry)
            if (idx + 1) % 20 == 0:
                logging.info(f"Processed {idx + 1}/{len(raw_list)} metadata...")
        except Exception as e:
            logging.error(f"Error fetching {url}: {e}")

with open("detailed_search_results.json", "w", encoding="utf-8") as f:
    json.dump(detailed_videos, f, ensure_ascii=False, indent=2)

print(f"Successfully processed metadata for {len(detailed_videos)} videos.")
