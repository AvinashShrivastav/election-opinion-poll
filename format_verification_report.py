import json

with open("bankipur_verified_candidates.json", "r", encoding="utf-8") as f:
    videos = json.load(f)

# Categorize based on keywords in title
exit_poll_post30 = []
ground_reports = []
party_analysis = []
other_bankipur = []

for v in videos:
    t = v['title'].lower()
    ch = v['channel']
    url = v['url']
    item_str = f"[{ch}] {v['title']} - {url}"
    
    if any(k in t for k in ["exit poll", "एग्जिट पोल", "30 july", "30 जुलाई", "वोटिंग के बाद", "voting ended", "मतदान सम्पन्न", "परिणाम"]):
        exit_poll_post30.append(v)
    elif any(k in t for k in ["ground report", "ग्राउंड रिपोर्ट", "public opinion", "पब्लिक ओपिनियन", "voter mood", "जनता का मूड", "kadamkuan", "pmch", "hathwa"]):
        ground_reports.append(v)
    elif any(k in t for k in ["prashant kishor", "प्रशांत किशोर", "nitin nabin", "नितिन नवीन", "jan suraaj", "जन सुराज", "bjp", "rjd"]):
        party_analysis.append(v)
    else:
        other_bankipur.append(v)

print(f"Exit Poll / Post-Voting Videos: {len(exit_poll_post30)}")
print(f"Ground Reports & Public Opinion: {len(ground_reports)}")
print(f"Party & Leader Analysis: {len(party_analysis)}")
print(f"Other Bankipur Election Coverage: {len(other_bankipur)}")
