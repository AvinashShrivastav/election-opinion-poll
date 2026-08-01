import json
import logging
import re
from typing import List, Dict
import yt_dlp
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

with open("raw_search_results.json", "r", encoding="utf-8") as f:
    raw_list = json.load(f)

print(f"Total raw candidates in raw_search_results.json: {len(raw_list)}")

# Load existing analyzed videos from extracted_data.json if present
existing_urls = set()
try:
    with open("extracted_data.json", "r", encoding="utf-8") as f:
        ex_data = json.load(f)
        for item in ex_data:
            meta = item.get("metadata", {})
            if meta.get("url"):
                existing_urls.add(meta["url"])
            if meta.get("id"):
                existing_urls.add(f"https://www.youtube.com/watch?v={meta['id']}")
except Exception as e:
    print("Could not load extracted_data.json:", e)

print(f"Already analyzed videos in dataset: {len(existing_urls)}")

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
}

ydl_opts = {
    'skip_download': True,
    'quiet': True,
    'http_headers': BROWSER_HEADERS
}

keywords = [
    "bankipur", "बांकीपुर", "बाकीपुर", "bakipur", 
    "exit poll", "एग्जिट पोल", "उपचुनाव", "by election", "by-election",
    "patna", "पटना", "nitin nabin", "नितिन नवीन", "prashant kishor", "प्रशांत किशोर",
    "jan suraaj", "जन सुराज", "ground report", "ग्राउंड रिपोर्ट", "public opinion", "पब्लिक ओपिनियन"
]

def fetch_info(item):
    url = item['url']
    vid = item['id']
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            title = info.get("title", item.get("title", ""))
            channel = info.get("uploader") or info.get("channel") or item.get("channel", "")
            upload_date = info.get("upload_date", "") # YYYYMMDD
            duration = info.get("duration", 0)
            view_count = info.get("view_count", 0)
            desc = info.get("description", "") or ""

            text_to_check = f"{title} {desc} {channel}".lower()
            
            # Check Bankipur relevance specifically
            is_bankipur = any(k in text_to_check for k in ["bankipur", "बांकीपुर", "बाकीपुर", "bakipur"])
            
            # Check Patna + election context fallback
            is_patna_election = "patna" in text_to_check and any(k in text_to_check for k in ["exit poll", "एग्जिट पोल", "voting", "वोटिंग", "election", "चुनाव", "ग्राउंड रिपोर्ट", "ground report"])

            if is_bankipur or is_patna_election:
                formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}" if len(upload_date) == 8 else upload_date
                
                # Check if uploaded on/after July 30, 2026
                is_post_30_july = (upload_date >= "20260730") if upload_date else False
                
                dur_m = duration // 60 if duration else 0
                dur_s = duration % 60 if duration else 0
                
                return {
                    "id": vid,
                    "title": title,
                    "channel": channel,
                    "upload_date": upload_date,
                    "formatted_date": formatted_date,
                    "duration_seconds": duration,
                    "duration_str": f"{dur_m}m {dur_s}s",
                    "view_count": view_count,
                    "url": url,
                    "is_post_30_july": is_post_30_july,
                    "already_in_dataset": url in existing_urls,
                    "relevancy_tag": "Bankipur Exit Poll / Post-Voting" if is_post_30_july else "Bankipur Ground Report / Opinion"
                }
        except Exception as e:
            pass
    return None

results = []
with ThreadPoolExecutor(max_workers=15) as executor:
    futures = [executor.submit(fetch_info, item) for item in raw_list]
    for idx, future in enumerate(as_completed(futures)):
        res = future.result()
        if res:
            results.append(res)

print(f"Total relevant videos filtered: {len(results)}")

# Sort by upload date (descending), then view count
results.sort(key=lambda x: (x['upload_date'], x['view_count']), reverse=True)

with open("bankipur_verified_candidates.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# Summarize breakdown
post_30 = [r for r in results if r['is_post_30_july']]
pre_30 = [r for r in results if not r['is_post_30_july']]

print(f"Post 30th July videos: {len(post_30)}")
print(f"Pre 30th July videos: {len(pre_30)}")
