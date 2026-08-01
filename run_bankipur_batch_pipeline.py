import json
import logging
import time
import os
import sys
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict

# Import core functions
from config import GEMINI_API_KEY, DEFAULT_MODEL, DEFAULT_PARTIES
from server import load_saved_results, save_results, ANALYZED_RESULTS, DATA_FILE, EXCEL_FILE
from transcript_fetcher import fetch_transcript, get_video_metadata, extract_video_id
from opinion_extractor import extract_opinions_from_transcript, extract_opinions_from_audio
from excel_reporter import generate_excel_report
from server import download_audio_track

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("bankipur_batch_pipeline.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

STATUS_FILE = "pipeline_status.json"
lock = threading.Lock()

def update_status_file(data_dict: dict):
    try:
        data_dict["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(STATUS_FILE, "w", encoding="utf-8") as f:
            json.dump(data_dict, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Failed writing {STATUS_FILE}: {e}")

def run_verified_bankipur_batch_fast(target_video_count=207, max_workers=8):
    logging.info("==========================================================================")
    logging.info(f"STARTING HIGH-SPEED CONCURRENT BATCH PIPELINE ({max_workers} WORKERS)")
    logging.info("==========================================================================")

    # 1. Load candidates
    with open("bankipur_verification_videos.json", "r", encoding="utf-8") as f:
        all_candidates = json.load(f)

    post_30_candidates = [c for c in all_candidates if c.get("is_post_30_july")]
    pre_30_candidates = [c for c in all_candidates if not c.get("is_post_30_july")]

    # 2. Load existing dataset
    load_saved_results(force=True)
    existing_video_ids = set()
    for item in ANALYZED_RESULTS:
        if item.get("analysis") is not None:
            meta = item.get("metadata", {})
            u = meta.get("url", "")
            vid = meta.get("id") or extract_video_id(u)
            if vid:
                existing_video_ids.add(vid)

    # 3. Queue candidates: Skip videos > 1 hour (3600s) as directed by user
    queue = [c for c in all_candidates if c["id"] not in existing_video_ids and 0 < c.get("duration_seconds", 0) <= 3600]
    skipped_gt_1hr = [c for c in all_candidates if c.get("duration_seconds", 0) > 3600]

    recent_logs = [
        {"time": datetime.now().strftime("%H:%M:%S"), "type": "info", "message": f"Pipeline active. {len(existing_video_ids)} existing videos analyzed, {len(skipped_gt_1hr)} multi-hour live streams skipped (>1 hr), {len(queue)} ground report videos queued."}
    ]

    status_state = {
        "is_running": True,
        "total_verified_candidates": len(all_candidates),
        "post_july30_count": len(post_30_candidates),
        "pre_july30_count": len(pre_30_candidates),
        "total_analyzed_in_dataset": len(existing_video_ids),
        "target_count": len(all_candidates),
        "queue_total": len(queue),
        "queue_processed_count": 0,
        "current_queue_index": 0,
        "currently_processing": None,
        "active_workers_count": max_workers,
        "recent_logs": recent_logs,
        "candidates": []
    }

    def build_candidate_list():
        c_list = []
        for c in all_candidates:
            v_id = c["id"]
            dur_sec = c.get("duration_seconds", 0)
            if v_id in existing_video_ids:
                status = "ANALYZED"
            elif dur_sec > 3600:
                status = "SKIPPED (>1 hr Live Stream)"
            else:
                status = "QUEUED"
            c_list.append({
                "id": v_id,
                "title": c["title"],
                "channel": c["channel"],
                "upload_date": c.get("formatted_date", ""),
                "duration_str": c.get("duration_str", "N/A"),
                "url": c["url"],
                "is_post_30_july": c.get("is_post_30_july", False),
                "status": status
            })
        return c_list

    status_state["candidates"] = build_candidate_list()
    update_status_file(status_state)

    parties = DEFAULT_PARTIES
    model_name = DEFAULT_MODEL
    queue_completed = 0

    def process_worker(candidate, item_index):
        nonlocal queue_completed
        video_url = candidate["url"]
        vid = candidate["id"]
        title = candidate["title"]
        channel = candidate["channel"]
        upload_date = candidate.get("formatted_date", "")

        with lock:
            status_state["currently_processing"] = {
                "id": vid,
                "title": title,
                "channel": channel,
                "upload_date": upload_date,
                "url": video_url,
                "stage": f"Parallel Extraction Active (Worker Pool)",
                "started_at": datetime.now().strftime("%H:%M:%S")
            }
            status_state["current_queue_index"] = item_index
            update_status_file(status_state)

        # Step A: Transcript Fetch
        transcript_res = fetch_transcript(video_url)
        meta = transcript_res.get("metadata", {})
        if not meta.get("title") or meta.get("title") == "Invalid URL":
            meta = {
                "id": vid,
                "title": title,
                "channel": channel,
                "upload_date": candidate.get("upload_date", ""),
                "duration": candidate.get("duration_seconds", 0),
                "url": video_url,
                "is_bankipur_constituency": True
            }
        else:
            meta["is_bankipur_constituency"] = True

        analysis = None

        if transcript_res.get("has_transcript") and transcript_res.get("transcript_text"):
            transcript_text = transcript_res["transcript_text"]
            if len(transcript_text.strip()) >= 50:
                try:
                    analysis = extract_opinions_from_transcript(
                        transcript_text=transcript_text,
                        video_title=title,
                        parties=parties,
                        api_key=GEMINI_API_KEY,
                        model_name=model_name
                    )
                except Exception as e:
                    logging.error(f"Transcript Gemini error for {title}: {e}")

        # Step B: Audio Fallback if no transcript
        if not analysis:
            audio_file = None
            try:
                audio_file = download_audio_track(video_url)
                analysis = extract_opinions_from_audio(
                    audio_path=audio_file,
                    video_title=title,
                    parties=parties,
                    api_key=GEMINI_API_KEY,
                    model_name=model_name
                )
            except Exception as e:
                logging.error(f"Audio fallback error for {title}: {e}")
            finally:
                if audio_file and os.path.exists(audio_file):
                    try:
                        os.remove(audio_file)
                    except Exception:
                        pass

        with lock:
            queue_completed += 1
            status_state["queue_processed_count"] = queue_completed
            if analysis:
                resp_count = len(getattr(analysis, "respondents", []))
                analysis_dict = analysis.model_dump() if hasattr(analysis, "model_dump") else analysis

                ANALYZED_RESULTS.append({
                    "metadata": meta,
                    "analysis": analysis_dict,
                    "error": None
                })
                existing_video_ids.add(vid)
                total_valid = len([i for i in ANALYZED_RESULTS if i.get("analysis") is not None])

                msg = f"⚡ [Queue Item {queue_completed}/{len(queue)}] Extracted {resp_count} voter opinions from [{channel}] '{title}'"
                logging.info(msg)
                recent_logs.insert(0, {"time": datetime.now().strftime("%H:%M:%S"), "type": "success", "message": msg})
                status_state["recent_logs"] = recent_logs[:50]
                status_state["total_analyzed_in_dataset"] = total_valid
                status_state["candidates"] = build_candidate_list()
                
                # Save checkpoint
                save_results()
                try:
                    generate_excel_report(ANALYZED_RESULTS, EXCEL_FILE)
                except Exception:
                    pass
            else:
                warn_msg = f"⚠️ Could not extract analysis for [{channel}] '{title}'. Moving to next queue item..."
                logging.warning(warn_msg)
                recent_logs.insert(0, {"time": datetime.now().strftime("%H:%M:%S"), "type": "warning", "message": warn_msg})

            update_status_file(status_state)
            return True

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_worker, c, idx): c for idx, c in enumerate(queue, start=1)}
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                logging.error(f"Worker exception: {e}")

    status_state["is_running"] = False
    status_state["currently_processing"] = None
    status_state["candidates"] = build_candidate_list()
    update_status_file(status_state)
    logging.info("FULL QUEUE BATCH PIPELINE COMPLETE!")

if __name__ == "__main__":
    target = 207
    workers = 8
    if len(sys.argv) > 1:
        target = int(sys.argv[1])
    if len(sys.argv) > 2:
        workers = int(sys.argv[2])
    run_verified_bankipur_batch_fast(target_video_count=target, max_workers=workers)
