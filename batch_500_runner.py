import time
import logging
import json
import os
from typing import List, Set
import yt_dlp

from server import run_extraction_task, load_saved_results, ANALYZED_RESULTS, DATA_FILE, EXCEL_FILE
from excel_reporter import generate_excel_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("batch_500_pipeline.log"),
        logging.StreamHandler()
    ]
)

SEARCH_QUERIES = [
    "Bankipur election public opinion",
    "Patna Sahib election public opinion",
    "Bihar chunav public opinion",
    "Jan Suraaj Bankipur public opinion",
    "Prashant Kishor Bankipur ground report",
    "Nitin Navin Bankipur public opinion",
    "Bihar election ground report 2025",
    "Patna city election public opinion",
    "Bankipur vidhan sabha public opinion",
    "Bihar bypoll public opinion live cities",
    "Bihar election public opinion news24",
    "Bihar election public opinion aajtak",
    "Bihar election public opinion abp news",
    "Bihar election public opinion bhaskar",
    "Bihar public opinion ground report local"
]

TARGET_VIDEO_COUNT = 500

def get_candidate_video_urls(query: str, max_results: int = 50) -> List[str]:
    """Fetches candidate YouTube video URLs for a search query using yt-dlp flat extraction."""
    urls = []
    ydl_opts = {
        'extract_flat': True,
        'skip_download': True,
        'quiet': True,
        'extractor_args': {'youtube': {'player_client': ['android', 'ios']}}
    }
    
    search_url = f"ytsearch{max_results}:{query}"
    logging.info(f"Searching YouTube for '{query}' (Targeting top {max_results} results)...")
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            res = ydl.extract_info(search_url, download=False)
            entries = res.get('entries', [])
            for entry in entries:
                if entry and entry.get('id'):
                    v_url = f"https://www.youtube.com/watch?v={entry['id']}"
                    urls.append(v_url)
    except Exception as e:
        logging.error(f"Error searching for query '{query}': {e}")
        
    return urls

def run_500_background_pipeline():
    logging.info("=========================================================")
    logging.info(f"STARTING 500-VIDEO BACKGROUND ELECTION OPINION PIPELINE")
    logging.info("=========================================================")

    load_saved_results()
    
    processed_video_ids: Set[str] = set()
    for item in ANALYZED_RESULTS:
        if item.get("analysis") is not None:
            meta = item.get("metadata", {})
            v_id = meta.get("id")
            if v_id:
                processed_video_ids.add(v_id)

    logging.info(f"Currently analyzed videos in dataset: {len(processed_video_ids)}")

    candidate_urls = []
    for query in SEARCH_QUERIES:
        if len(candidate_urls) >= TARGET_VIDEO_COUNT * 2:
            break
        q_urls = get_candidate_video_urls(query, max_results=40)
        candidate_urls.extend(q_urls)
        time.sleep(1.0) # Search query delay

    # Deduplicate candidate URLs
    unique_candidates = []
    seen_ids = set(processed_video_ids)
    for u in candidate_urls:
        v_id = u.split("v=")[-1].split("&")[0]
        if v_id not in seen_ids:
            seen_ids.add(v_id)
            unique_candidates.append(u)

    logging.info(f"Discovered {len(unique_candidates)} NEW candidate videos for analysis.")

    parties = ["BJP", "Jan Suraaj", "RJD", "JDU", "Congress", "NDA", "Mahagathbandhan", "Others", "Undecided / Neutral"]
    model_name = "gemini-2.5-flash"

    processed_in_this_run = 0
    for idx, video_url in enumerate(unique_candidates, start=1):
        # Refresh processed count
        valid_count = len([i for i in ANALYZED_RESULTS if i.get("analysis") is not None])
        if valid_count >= TARGET_VIDEO_COUNT:
            logging.info(f"TARGET REACHED! {valid_count} videos analyzed in pipeline.")
            break

        logging.info(f"[{valid_count}/{TARGET_VIDEO_COUNT}] Processing candidate video #{idx}: {video_url}")
        
        try:
            run_extraction_task([video_url], parties, model_name)
            processed_in_this_run += 1
        except Exception as e:
            logging.error(f"Error processing video {video_url}: {e}")

        # Human-like delay pacing to prevent IP rate-limits
        time.sleep(2.5)

    final_count = len([i for i in ANALYZED_RESULTS if i.get("analysis") is not None])
    logging.info("=========================================================")
    logging.info(f"BACKGROUND PIPELINE COMPLETE! Total analyzed videos: {final_count}")
    logging.info("=========================================================")

if __name__ == "__main__":
    run_500_background_pipeline()
