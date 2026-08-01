import json

with open("raw_search_results.json", "r", encoding="utf-8") as f:
    raw_results = json.load(f)

with open("fast_candidate_list.json", "r", encoding="utf-8") as f:
    fast_candidates = json.load(f)

# Load existing dataset URLs to flag already analyzed videos
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
    pass

print(f"Total raw videos: {len(raw_results)}")
print(f"Total fast candidate items: {len(fast_candidates)}")

# Clean and deduplicate candidates
unique_candidates = {}
for item in fast_candidates:
    vid = item['id']
    if vid not in unique_candidates:
        unique_candidates[vid] = {
            "id": vid,
            "title": item['title'],
            "channel": item['channel'],
            "url": item['url'],
            "already_analyzed": item['url'] in existing_urls
        }

candidate_list = list(unique_candidates.values())

with open("bankipur_verified_candidates.json", "w", encoding="utf-8") as f:
    json.dump(candidate_list, f, ensure_ascii=False, indent=2)

print(f"Clean candidate list count: {len(candidate_list)}")
