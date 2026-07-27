import os
import json
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import yt_dlp

from config import GEMINI_API_KEY, DEFAULT_MODEL, DEFAULT_PARTIES
from transcript_fetcher import fetch_transcript, BROWSER_HEADERS
from opinion_extractor import extract_opinions_from_transcript
from excel_reporter import generate_excel_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

DATA_FILE = "extracted_data.json"
EXCEL_FILE = "election_opinions_report.xlsx"

QUERIES = [
    'Bankipur public opinion',
    'Bankipur by election public opinion',
    'Bankipur chunav public opinion',
    'Bankipur ground report',
    'Bankipur janta ka mood',
    'Bankipur Prashant Kishor public opinion',
    'Bankipur Jan Suraaj public opinion',
    'Bankipur BJP vs RJD public opinion',
    'Patna Bankipur election public opinion',
    'Bihar election public opinion ground report',
    'Bihar chunav public opinion ground report',
    'Patna Sahib public opinion ground report',
    'Patna janta ka mood ground report',
    'Prashant Kishor Jan Suraaj public opinion',
    'BJP vs Mahagathbandhan Bihar public opinion'
]

def collect_large_youtube_url_pool(target_pool_size=300) -> list:
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'http_headers': BROWSER_HEADERS
    }
    urls = []
    seen = set()

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for q in QUERIES:
            if len(urls) >= target_pool_size:
                break
            logging.info(f"Searching YouTube for query: '{q}'...")
            try:
                res = ydl.extract_info(f'ytsearch35:{q}', download=False)
                for entry in res.get('entries', []):
                    if entry and 'id' in entry and entry['id']:
                        u = f"https://www.youtube.com/watch?v={entry['id']}"
                        if u not in seen:
                            seen.add(u)
                            urls.append(u)
                            if len(urls) >= target_pool_size:
                                break
                time.sleep(1.0)
            except Exception as e:
                logging.error(f"Error searching query '{q}': {e}")

    logging.info(f"Collected candidate pool of {len(urls)} unique YouTube video URLs.")
    return urls

def process_single_video_paced(video_url: str):
    """Paced text transcript extraction with rate control."""
    time.sleep(0.5) # Gentle pacing to prevent IP rate limits
    transcript_res = fetch_transcript(video_url)
    meta = transcript_res.get("metadata", {})
    title = meta.get("title", "Video")

    if not transcript_res.get("has_transcript") or not transcript_res.get("transcript_text"):
        return None

    transcript_text = transcript_res["transcript_text"]
    if len(transcript_text.strip()) < 50:
        return None

    analysis = extract_opinions_from_transcript(
        transcript_text=transcript_text,
        video_title=title,
        parties=DEFAULT_PARTIES,
        api_key=GEMINI_API_KEY,
        model_name=DEFAULT_MODEL
    )

    if analysis:
        resp_count = len(getattr(analysis, "respondents", []))
        logging.info(f"SUCCESS! Extracted {resp_count} voter opinions from '{title}'.")
        return {
            "metadata": meta,
            "analysis": analysis.model_dump() if hasattr(analysis, "model_dump") else analysis,
            "error": None
        }
    return None

def run_until_100_text_transcripts(target_analyzed_count=100, max_workers=3):
    all_results = []
    processed_urls = set()

    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                for item in raw_data:
                    u = item.get("metadata", {}).get("url")
                    if u:
                        processed_urls.add(u)
                    if item.get("analysis") is not None:
                        all_results.append(item)
        except Exception:
            pass

    logging.info(f"Starting paced pipeline (TEXT TRANSCRIPTS) with {len(all_results)} existing analyzed videos. Target is {target_analyzed_count} analyzed videos.")

    if len(all_results) >= target_analyzed_count:
        logging.info(f"Target of {target_analyzed_count} analyzed videos already reached!")
        return

    candidate_urls = collect_large_youtube_url_pool(target_pool_size=300)
    unprocessed = [u for u in candidate_urls if u not in processed_urls]

    logging.info(f"Processing candidate URLs pool ({len(unprocessed)} unprocessed) via Paced Text Transcripts...")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_single_video_paced, u): u for u in unprocessed}

        for future in as_completed(futures):
            try:
                res = future.result()
                if res and res.get("analysis") is not None:
                    all_results.append(res)
                    logging.info(f"--> Total Analyzed Videos Progress: [{len(all_results)}/{target_analyzed_count}]")
                    
                    # Save checkpoint every 5 videos
                    if len(all_results) % 5 == 0 or len(all_results) >= target_analyzed_count:
                        with open(DATA_FILE, "w", encoding="utf-8") as f:
                            json.dump(all_results, f, indent=2, ensure_ascii=False)
                        generate_excel_report(all_results, EXCEL_FILE)

                    if len(all_results) >= target_analyzed_count:
                        logging.info(f"REACHED TARGET OF {target_analyzed_count} ANALYZED VIDEOS VIA TEXT TRANSCRIPTS!")
                        executor.shutdown(wait=False, cancel_futures=True)
                        break
            except Exception as e:
                logging.error(f"Worker error: {e}")

    # Final save
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    generate_excel_report(all_results, EXCEL_FILE)
    logging.info(f"COMPLETE! {len(all_results)} videos fully analyzed via text transcripts and saved to Excel: {os.path.abspath(EXCEL_FILE)}")

if __name__ == "__main__":
    run_until_100_text_transcripts(target_analyzed_count=100, max_workers=3)
