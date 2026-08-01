import json
import logging
import re
import os
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
}

queries = [
    "Bankipur election exit poll",
    "Bankipur election ground report 30 July",
    "Bankipur public opinion post voting",
    "बांकीपुर चुनाव एग्जिट पोल",
    "बांकीपुर विधानसभा एग्जिट पोल 30 जुलाई",
    "बांकीपुर पब्लिक ओपिनियन वोटिंग के बाद",
    "Bankipur election exit poll 2026",
    "Bankipur voting exit poll",
    "Patna Bankipur election exit poll",
    "बांकीपुर जनता का मूड वोटिंग",
    "बांकीपुर उपचुनाव एग्जिट पोल",
    "Bankipur by election ground report post election",
    "Bankipur exit poll news",
    "बांकीपुर वोटिंग के बाद एग्जिट पोल",
    "Bankipur Prashant Kishor exit poll",
    "Bankipur Nitin Nabin exit poll",
    "बांकीपुर चुनाव परिणाम एग्जिट पोल",
    "Bankipur news exit poll 2026",
    "Live Cities Bankipur exit poll",
    "ABP Live Bankipur exit poll",
    "News24 Bankipur exit poll",
    "Dainik Bhaskar Bankipur exit poll",
    "Bharat Prime Bankipur exit poll",
    "The Bihar Top Bankipur exit poll"
]

ydl_opts_search = {
    'extract_flat': True,
    'skip_download': True,
    'quiet': True,
    'http_headers': BROWSER_HEADERS
}

all_search_entries = {}

with yt_dlp.YoutubeDL(ydl_opts_search) as ydl:
    for query in queries:
        logging.info(f"Searching: {query}")
        try:
            res = ydl.extract_info(f"ytsearch50:{query}", download=False)
            for entry in res.get('entries', []):
                if entry and entry.get('id'):
                    vid = entry['id']
                    if vid not in all_search_entries:
                        all_search_entries[vid] = {
                            "id": vid,
                            "title": entry.get("title", ""),
                            "channel": entry.get("uploader") or entry.get("channel") or "",
                            "url": f"https://www.youtube.com/watch?v={vid}"
                        }
        except Exception as e:
            logging.error(f"Search error for '{query}': {e}")

print(f"Total unique search entries collected: {len(all_search_entries)}")

# Now fetch full metadata for candidate filtering
ydl_opts_info = {
    'skip_download': True,
    'quiet': True,
    'http_headers': BROWSER_HEADERS
}

detailed_results = []
bankipur_keywords = ["bankipur", "बांकीपुर", "बाकीपुर", "bakipur", "patna", "पटना", "exit poll", "एग्जिट पोल", "उपचुनाव", "by-election", "by election", "voting", "वोटिंग", "मतदान", "nitin nabin", "नितिन नवीन", "prashant kishor", "प्रशांत किशोर", "jan suraaj", "जन सुराज"]

with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
    for idx, (vid, item) in enumerate(all_search_entries.items()):
        url = item['url']
        try:
            info = ydl.extract_info(url, download=False)
            title = info.get("title", item["title"])
            channel = info.get("uploader") or info.get("channel") or item["channel"]
            upload_date = info.get("upload_date", "")  # YYYYMMDD
            duration = info.get("duration", 0)
            view_count = info.get("view_count", 0)
            description = info.get("description", "") or ""

            # Relevancy check: Title or description mentions Bankipur / बांकीपुर / Bakipur / Patna Election
            combined_text = (title + " " + description + " " + channel).lower()

            is_relevant = any(k in combined_text for k in ["bankipur", "बांकीपुर", "बाकीपुर", "bakipur"]) or \
                          ("patna" in combined_text and any(k in combined_text for k in ["exit poll", "एग्जिट पोल", "voting", "वोटिंग", "election", "चुनाव"]))

            if is_relevant:
                formatted_date = ""
                if upload_date and len(upload_date) == 8:
                    formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
                else:
                    formatted_date = upload_date

                dur_min = duration // 60 if duration else 0
                dur_sec = duration % 60 if duration else 0

                detailed_results.append({
                    "id": vid,
                    "title": title,
                    "channel": channel,
                    "upload_date": upload_date,
                    "formatted_date": formatted_date,
                    "duration_seconds": duration,
                    "duration_str": f"{dur_min}m {dur_sec}s",
                    "view_count": view_count,
                    "url": url,
                    "is_post_july30": upload_date >= "20260730" if upload_date else False
                })
        except Exception as e:
            logging.error(f"Error fetching metadata for {vid}: {e}")

        if (idx + 1) % 25 == 0 or (idx + 1) == len(all_search_entries):
            logging.info(f"Processed {idx + 1}/{len(all_search_entries)} videos. Relevant found: {len(detailed_results)}")

with open("bankipur_searched_videos.json", "w", encoding="utf-8") as f:
    json.dump(detailed_results, f, ensure_ascii=False, indent=2)

print(f"Saved {len(detailed_results)} relevant Bankipur videos to bankipur_searched_videos.json")
