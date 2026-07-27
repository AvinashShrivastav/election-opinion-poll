import os
import json
import matplotlib.pyplot as plt

DATA_FILE = "extracted_data.json"
os.makedirs("chart_images", exist_ok=True)

with open(DATA_FILE, "r", encoding="utf-8") as f:
    raw_data = json.load(f)

bankipur_data = [item for item in raw_data if item.get("metadata", {}).get("is_bankipur_constituency", True) and item.get("analysis")]

respondents = []
party_counts = {}
issue_counts = {}
media_counts = {}

for item in bankipur_data:
    meta = item.get("metadata", {})
    analysis = item.get("analysis", {})
    resps = analysis.get("respondents", [])
    
    channel = meta.get("channel", "Independent Media").strip()
    if "ABP" in channel: channel = "ABP Live / News"
    elif "Live Cities" in channel: channel = "Live Cities"
    elif "Bharat Prime" in channel: channel = "Bharat Prime"
    elif "Bhaskar" in channel: channel = "Dainik Bhaskar"
    elif "News24" in channel: channel = "News24"

    media_counts[channel] = media_counts.get(channel, 0) + len(resps)

    for r in resps:
        respondents.append(r)
        p = r.get("preferred_party", "Others")
        party_counts[p] = party_counts.get(p, 0) + 1

        for issue in r.get("key_issues", []):
            clean_i = str(issue).strip().title()
            if clean_i:
                issue_counts[clean_i] = issue_counts.get(clean_i, 0) + 1

total_voters = len(respondents)

# Style setup for clean modern dark/light look
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

# 1. Party Preference Bar Chart
sorted_parties = sorted(party_counts.items(), key=lambda x: x[1], reverse=True)[:6]
labels = [p[0] for p in sorted_parties]
values = [p[1] for p in sorted_parties]
colors_list = ['#f97316', '#0284c7', '#64748b', '#8b5cf6', '#16a34a', '#d97706']

fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
bars = ax.bar(labels, values, color=colors_list[:len(labels)], width=0.5, edgecolor='#cbd5e1', linewidth=1)
ax.set_title("Bankipur Assembly Constituency - Party Preference Share (N = 393)", fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax.set_ylabel("Number of Interviewed Voters", fontsize=10, fontweight='bold', color='#475569')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', linestyle='--', alpha=0.5)

for bar in bars:
    yval = bar.get_height()
    pct = (yval / total_voters) * 100
    ax.text(bar.get_x() + bar.get_width()/2, yval + 2, f"{yval}\n({pct:.1f}%)", ha='center', va='bottom', fontsize=9, fontweight='bold', color='#0f172a')

plt.tight_layout()
plt.savefig("chart_images/party_preference_share.png")
plt.close()

# 2. Top Decisive Voter Issues Horizontal Chart
sorted_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:6]
i_labels = [i[0] for i in sorted_issues][::-1]
i_values = [i[1] for i in sorted_issues][::-1]

fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
bars = ax.barh(i_labels, i_values, color='#0284c7', height=0.5, edgecolor='#0369a1', linewidth=1)
ax.set_title("Top Decisive Voter Issues Impacting Choice in Bankipur", fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax.set_xlabel("Verbatim Mentions across Field Reports", fontsize=10, fontweight='bold', color='#475569')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='x', linestyle='--', alpha=0.5)

for i, v in enumerate(i_values):
    ax.text(v + 1.5, i, f"{v} mentions", va='center', fontsize=9, fontweight='bold', color='#0f172a')

plt.tight_layout()
plt.savefig("chart_images/top_voter_issues.png")
plt.close()

# 3. Media House Coverage Volume Chart
sorted_media = sorted(media_counts.items(), key=lambda x: x[1], reverse=True)[:6]
m_labels = [m[0] for m in sorted_media]
m_values = [m[1] for m in sorted_media]

fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
bars = ax.bar(m_labels, m_values, color='#8b5cf6', width=0.5, edgecolor='#6d28d9', linewidth=1)
ax.set_title("Media Outlet Coverage Volume & Interviewed Voters Share", fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax.set_ylabel("Interviewed Citizens Count", fontsize=10, fontweight='bold', color='#475569')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(axis='y', linestyle='--', alpha=0.5)

for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, yval + 1.5, f"{yval} Voters", ha='center', va='bottom', fontsize=9, fontweight='bold', color='#0f172a')

plt.tight_layout()
plt.savefig("chart_images/media_house_split.png")
plt.close()

print("Generated 3 high-resolution chart images in 'chart_images/'!")
