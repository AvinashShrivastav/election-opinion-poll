import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

with open("fast_candidate_list.json", "r", encoding="utf-8") as f:
    candidates = json.load(f)

print(f"Loaded {len(candidates)} candidates.")

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
}

ydl_opts = {
    'skip_download': True,
    'quiet': True,
    'no_warnings': True,
    'http_headers': BROWSER_HEADERS
}

def get_meta(item):
    url = item['url']
    vid = item['id']
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return None
            title = info.get("title") or item['title']
            channel = info.get("uploader") or info.get("channel") or item['channel']
            upload_date = info.get("upload_date", "") # YYYYMMDD
            duration = info.get("duration", 0)
            view_count = info.get("view_count", 0)
            
            # Format date: 20260730 -> 2026-07-30
            fmt_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}" if len(upload_date) == 8 else (upload_date or "Unknown Date")
            
            dur_m = duration // 60 if duration else 0
            dur_s = duration % 60 if duration else 0
            
            # Is post 30th July 2026?
            is_post_30 = upload_date >= "20260730" if upload_date else False

            return {
                "id": vid,
                "title": title,
                "channel": channel,
                "upload_date": upload_date,
                "formatted_date": fmt_date,
                "duration_str": f"{dur_m}m {dur_s}s" if duration else "N/A",
                "duration_seconds": duration,
                "view_count": view_count,
                "url": url,
                "is_post_30_july": is_post_30,
                "already_in_dataset": item.get("already_in_dataset", False)
            }
    except Exception as e:
        return None

results = []
counter = 0
with ThreadPoolExecutor(max_workers=20) as executor:
    futures = {executor.submit(get_meta, item): item for item in candidates}
    for future in as_completed(futures):
        res = future.result()
        counter += 1
        if res:
            results.append(res)
        if counter % 50 == 0:
            print(f"Fetched metadata for {counter}/{len(candidates)} videos...")

print(f"Total videos successfully fetched with metadata: {len(results)}")

# Sort by upload_date descending (newest first), then by view count
results.sort(key=lambda x: (x['upload_date'], x['view_count']), reverse=True)

with open("bankipur_verification_videos.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Saved to bankipur_verification_videos.json")
