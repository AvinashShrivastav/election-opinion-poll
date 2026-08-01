import json

artifact_path = "/Users/avinash/.gemini/antigravity-ide/brain/f4e855fd-b0d1-47a0-a1c9-2498da7e6e18/bankipur_candidate_videos_for_verification.md"

with open("bankipur_verification_videos.json", "r", encoding="utf-8") as f:
    videos = json.load(f)

# Load existing dataset URLs
existing_urls = set()
try:
    with open("extracted_data.json", "r", encoding="utf-8") as f:
        ex_data = json.load(f)
        for item in ex_data:
            meta = item.get("metadata", {})
            if meta.get("url"): existing_urls.add(meta["url"])
            if meta.get("id"): existing_urls.add(f"https://www.youtube.com/watch?v={meta['id']}")
except Exception as e:
    pass

post30 = [v for v in videos if v.get('is_post_30_july')]
pre30 = [v for v in videos if not v.get('is_post_30_july')]

content = f"""# 🗳️ Bankipur Election Exit Poll & Ground Report Videos - Candidate Verification List

> **Target Constituency:** Bankipur Assembly Constituency (Patna, Bihar)  
> **Election Date:** 30th July 2026  
> **Total Fully Verified Candidate Videos:** {len(videos)}  
> **Published Post July 30th (Exit Poll & Post-Voting):** {len(post30)}  
> **Pre July 30th Ground Reports:** {len(pre30)}  

---

## 📊 Summary Breakdown

| Category | Description | Count | Status |
| :--- | :--- | :---: | :--- |
| **Category A: Post-Voting & Exit Polls** | Videos published on/after 30th July with exit poll numbers & post-voting voter reactions | **{len(post30)}** | 🟢 Ready for Batch Pipeline |
| **Category B: Ground Reports & Public Opinion** | On-the-ground interviews from PMCH, Kadamkuan, Hathwa Market, Nala Road, Rajendra Nagar | **{len(pre30)}** | 🟢 Ready for Batch Pipeline |

---

## 📋 Category A: Post-Voting & Exit Poll Videos (July 30th Onwards)

| # | Date | Channel | Video Title | Duration | YouTube Link | Status |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
"""

for idx, v in enumerate(post30, 1):
    status_tag = "✅ *Analyzed*" if v['url'] in existing_urls else "🆕 **New Candidate**"
    content += f"| {idx} | `{v['formatted_date']}` | **{v['channel']}** | {v['title']} | `{v['duration_str']}` | [Watch Video]({v['url']}) | {status_tag} |\n"

content += f"""\n---

## 📋 Category B: Ground Reports & Voter Public Opinion (Pre July 30th)

| # | Date | Channel | Video Title | Duration | YouTube Link | Status |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
"""

for idx, v in enumerate(pre30, 1):
    status_tag = "✅ *Analyzed*" if v['url'] in existing_urls else "🆕 **New Candidate**"
    content += f"| {idx} | `{v['formatted_date']}` | **{v['channel']}** | {v['title']} | `{v['duration_str']}` | [Watch Video]({v['url']}) | {status_tag} |\n"

content += """\n---

## 🚀 Next Steps
Once you verify and approve this candidate list, we will:
1. Run `batch_pipeline_runner.py` / `batch_500_runner.py` across all new verified videos.
2. Ingest text transcripts and fall back to Gemini Multimodal Audio API (`gemini-2.5-flash`) for audio-only ground reporting.
3. Extract new verbatim citizen testimonies, updated party preference percentages (BJP vs. Jan Suraaj vs. Undecided), and decisive voter issues.
4. Regenerate `extracted_data.json`, `election_opinions_report.xlsx`, `bankipur_election_report.pdf`, and the Next.js Analytics Dashboard!
"""

with open(artifact_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Artifact updated with metadata for {len(videos)} videos.")
