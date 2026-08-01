import os
import json
import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp

from config import GEMINI_API_KEY, DEFAULT_MODEL, DEFAULT_PARTIES
from transcript_fetcher import fetch_transcript, get_playlist_video_urls, extract_video_id, get_video_metadata
from opinion_extractor import extract_opinions_from_transcript, extract_opinions_from_audio
from excel_reporter import generate_excel_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(title="Election Public Opinion API Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "extracted_data.json"
EXCEL_FILE = "election_opinions_report.xlsx"
PDF_FILE = "bankipur_election_report.pdf"

ANALYZED_RESULTS: List[Dict] = []
LAST_LOADED_MTIME: float = 0.0

def load_saved_results(force: bool = False):
    global ANALYZED_RESULTS, LAST_LOADED_MTIME
    if os.path.exists(DATA_FILE):
        mtime = os.path.getmtime(DATA_FILE)
        if force or mtime > LAST_LOADED_MTIME:
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    ANALYZED_RESULTS = [item for item in raw_data if item.get("analysis") is not None]
                    LAST_LOADED_MTIME = mtime
                    logging.info(f"Loaded {len(ANALYZED_RESULTS)} valid saved video analyses from {DATA_FILE}")
            except Exception as e:
                logging.error(f"Error loading saved data: {e}")

def save_results():
    global LAST_LOADED_MTIME
    try:
        serializable = []
        for item in ANALYZED_RESULTS:
            if item.get("analysis") is None:
                continue
            meta = item.get("metadata", {})
            analysis = item.get("analysis")
            
            analysis_dict = None
            if analysis:
                if hasattr(analysis, "model_dump"):
                    analysis_dict = analysis.model_dump()
                elif isinstance(analysis, dict):
                    analysis_dict = analysis

            serializable.append({
                "metadata": meta,
                "analysis": analysis_dict,
                "error": item.get("error")
            })

        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2, ensure_ascii=False)
        LAST_LOADED_MTIME = os.path.getmtime(DATA_FILE)
    except Exception as e:
        logging.error(f"Error saving data to JSON: {e}")

load_saved_results(force=True)

class AnalyzeRequest(BaseModel):
    urls: List[str]
    parties: Optional[List[str]] = None
    model_name: Optional[str] = DEFAULT_MODEL

def download_audio_track(video_url: str) -> str:
    """Downloads audio track for videos using android/ios player clients to bypass YouTube bot checks."""
    temp_filename = f"temp_{uuid.uuid4().hex[:8]}.m4a"
    ydl_opts = {
        'format': 'm4a/bestaudio/best',
        'outtmpl': temp_filename,
        'quiet': True,
        'extractor_args': {'youtube': {'player_client': ['android', 'ios']}}
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])
    return temp_filename

def run_extraction_task(urls: List[str], parties: List[str], model_name: str):
    global ANALYZED_RESULTS
    load_saved_results()
    
    expanded_urls = []
    for url in urls:
        url = url.strip()
        if not url:
            continue
        if "playlist" in url or "list=" in url:
            p_urls = get_playlist_video_urls(url)
            expanded_urls.extend(p_urls)
        else:
            expanded_urls.append(url)

    for u in expanded_urls:
        record_user_added_video(u, source="YouTube Extension / Web UI")

    existing_video_ids = set()
    for item in ANALYZED_RESULTS:
        if item.get("analysis") is not None:
            meta = item.get("metadata", {})
            u = meta.get("url", "")
            v_id = meta.get("id") or extract_video_id(u)
            if v_id:
                existing_video_ids.add(v_id)

    unique_urls = []
    for u in expanded_urls:
        v_id = extract_video_id(u)
        if v_id and v_id not in existing_video_ids:
            existing_video_ids.add(v_id)
            unique_urls.append(u)
        elif not v_id:
            unique_urls.append(u)

    if not unique_urls:
        logging.info("All provided YouTube URLs are already analyzed in the pipeline.")
        return

    for idx, video_url in enumerate(unique_urls, start=1):
        logging.info(f"Processing new video ({idx}/{len(unique_urls)}): {video_url}")
        
        transcript_res = fetch_transcript(video_url)
        meta = transcript_res.get("metadata", {})
        if not meta.get("title") or meta.get("title") == "Invalid URL":
            meta = get_video_metadata(video_url)

        title = meta.get("title", f"Video {idx}")
        lower_t = title.lower()
        meta["is_bankipur_constituency"] = any(k in lower_t for k in ["bankipur", "बांकीपुर", "बाकीपुर", "नितिन नवीन"])

        analysis = None
        if transcript_res.get("has_transcript") and transcript_res.get("transcript_text"):
            transcript_text = transcript_res["transcript_text"]
            if len(transcript_text.strip()) >= 50:
                logging.info(f"Using Text Transcript for '{title}'...")
                analysis = extract_opinions_from_transcript(
                    transcript_text=transcript_text,
                    video_title=title,
                    parties=parties,
                    api_key=GEMINI_API_KEY,
                    model_name=model_name
                )

        if not analysis:
            audio_file = None
            try:
                logging.info(f"Downloading audio track for Gemini Multimodal Audio analysis for '{title}'...")
                audio_file = download_audio_track(video_url)
                analysis = extract_opinions_from_audio(
                    audio_path=audio_file,
                    video_title=title,
                    parties=parties,
                    api_key=GEMINI_API_KEY,
                    model_name=model_name
                )
            except Exception as e:
                logging.error(f"Audio fallback error for '{title}': {e}")
            finally:
                if audio_file and os.path.exists(audio_file):
                    try:
                        os.remove(audio_file)
                    except Exception:
                        pass

        if analysis:
            logging.info(f"SUCCESS! Extracted voter opinions for '{title}'.")
            ANALYZED_RESULTS.append({
                "metadata": meta,
                "analysis": analysis.model_dump() if hasattr(analysis, "model_dump") else analysis,
                "error": None
            })

    save_results()
    try:
        generate_excel_report(ANALYZED_RESULTS, EXCEL_FILE)
    except Exception as e:
        logging.error(f"Error generating Excel report: {e}")

@app.get("/api/health")
def health_check():
    load_saved_results()
    valid_count = len([i for i in ANALYZED_RESULTS if i.get("analysis") is not None])
    bankipur_count = len([i for i in ANALYZED_RESULTS if i.get("metadata", {}).get("is_bankipur_constituency", True)])
    return {"status": "ok", "total_videos_analyzed": valid_count, "bankipur_specific_videos": bankipur_count}

@app.get("/api/pipeline-status")
def get_pipeline_status():
    if os.path.exists("pipeline_status.json"):
        try:
            with open("pipeline_status.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"is_running": False, "total_verified_candidates": 207}

@app.get("/api/results")
def get_results(scope: str = Query("bankipur", description="'bankipur' for Bankipur constituency only, or 'all'")):
    load_saved_results(force=True)
    respondent_list = []
    video_list = []
    party_counts = {}
    issue_counts = {}

    for item in ANALYZED_RESULTS:
        meta = item.get("metadata", {})
        analysis = item.get("analysis")
        
        is_bankipur = True

        v_title = meta.get("title", "")
        v_channel = meta.get("channel", "")
        v_url = meta.get("url", "")
        v_date = meta.get("upload_date", "")

        if not analysis or isinstance(analysis, str):
            continue

        resps = analysis.get("respondents", []) if isinstance(analysis, dict) else getattr(analysis, "respondents", [])
        v_summary = analysis.get("overall_video_summary", "") if isinstance(analysis, dict) else getattr(analysis, "overall_video_summary", "")

        video_list.append({
            "title": v_title,
            "channel": v_channel,
            "url": v_url,
            "upload_date": v_date,
            "respondent_count": len(resps),
            "summary": v_summary,
            "is_bankipur_constituency": is_bankipur,
            "audit_reason": meta.get("constituency_audit_reason", "")
        })

        for r in resps:
            p_party = r.get("preferred_party", "Others") if isinstance(r, dict) else getattr(r, "preferred_party", "Others")
            party_counts[p_party] = party_counts.get(p_party, 0) + 1

            key_issues = r.get("key_issues", []) if isinstance(r, dict) else getattr(r, "key_issues", [])
            for issue in key_issues:
                clean_issue = str(issue).strip().title()
                if clean_issue:
                    issue_counts[clean_issue] = issue_counts.get(clean_issue, 0) + 1

            respondent_list.append({
                "video_title": v_title,
                "channel": v_channel,
                "video_url": v_url,
                "upload_date": v_date,
                "respondent_id": r.get("respondent_id", "") if isinstance(r, dict) else getattr(r, "respondent_id", ""),
                "preferred_party": p_party,
                "stance_certainty": r.get("stance_certainty", "Undecided") if isinstance(r, dict) else getattr(r, "stance_certainty", "Undecided"),
                "key_reason": r.get("key_reason", "") if isinstance(r, dict) else getattr(r, "key_reason", ""),
                "key_issues": key_issues,
                "quote_original": r.get("quote_original", "") if isinstance(r, dict) else getattr(r, "quote_original", ""),
                "quote_english": r.get("quote_english", "") if isinstance(r, dict) else getattr(r, "quote_english", ""),
                "demographics_or_context": r.get("demographics_or_context", "") if isinstance(r, dict) else getattr(r, "demographics_or_context", ""),
                "is_bankipur_constituency": is_bankipur
            })

    return {
        "scope": scope,
        "summary_stats": {
            "total_videos": len(video_list),
            "total_respondents": len(respondent_list),
            "party_counts": party_counts,
            "issue_counts": issue_counts
        },
        "videos": video_list,
        "respondents": respondent_list
    }

@app.get("/api/video-summary/{video_id}")
def get_video_summary(video_id: str):
    load_saved_results()
    for item in ANALYZED_RESULTS:
        if item.get("analysis") is None:
            continue
        meta = item.get("metadata", {})
        u = meta.get("url", "")
        v_id = meta.get("id") or extract_video_id(u)

        if v_id == video_id:
            analysis = item.get("analysis")
            resps = analysis.get("respondents", []) if isinstance(analysis, dict) else getattr(analysis, "respondents", [])
            summary = analysis.get("overall_video_summary", "") if isinstance(analysis, dict) else getattr(analysis, "overall_video_summary", "")

            party_counts = {}
            for r in resps:
                p = r.get("preferred_party", "Others") if isinstance(r, dict) else getattr(r, "preferred_party", "Others")
                party_counts[p] = party_counts.get(p, 0) + 1

            return {
                "exists": True,
                "video_id": video_id,
                "title": meta.get("title", ""),
                "channel": meta.get("channel", ""),
                "total_respondents": len(resps),
                "party_counts": party_counts,
                "summary": summary,
                "respondents": resps,
                "is_bankipur_constituency": meta.get("is_bankipur_constituency", True),
                "audit_reason": meta.get("constituency_audit_reason", "")
            }

    return {"exists": False}

USER_ADDED_FILE = "user_added_extension_videos.json"

def record_user_added_video(url: str, title: str = "", source: str = "YouTube Extension"):
    try:
        vid = extract_video_id(url)
        records = []
        if os.path.exists(USER_ADDED_FILE):
            try:
                with open(USER_ADDED_FILE, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except Exception:
                records = []
        
        # Check if already recorded
        for r in records:
            if r.get("id") == vid or r.get("url") == url:
                return

        records.insert(0, {
            "id": vid,
            "url": url,
            "title": title or f"YouTube Video ({vid})",
            "added_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source": source
        })

        with open(USER_ADDED_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Failed to record user added video: {e}")

@app.get("/api/user-added-videos")
def get_user_added_videos():
    if os.path.exists(USER_ADDED_FILE):
        try:
            with open(USER_ADDED_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

@app.post("/api/analyze")
def analyze_videos(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    if not req.urls:
        raise HTTPException(status_code=400, detail="No YouTube URLs provided.")

    for u in req.urls:
        record_user_added_video(u, source="YouTube Extension / Web UI")

    target_parties = req.parties or DEFAULT_PARTIES
    model = req.model_name or DEFAULT_MODEL

    run_extraction_task(req.urls, target_parties, model)
    
    return {
        "status": "success",
        "message": f"Processed request for {len(req.urls)} video URL(s).",
        "data": get_results()
    }

@app.get("/api/export")
def export_excel():
    load_saved_results()
    if not os.path.exists(EXCEL_FILE):
        try:
            generate_excel_report(ANALYZED_RESULTS, EXCEL_FILE)
        except Exception as e:
            raise HTTPException(status_code=404, detail="Excel report not found.")

    return FileResponse(
        path=EXCEL_FILE,
        filename="election_opinions_report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.get("/api/export-pdf")
def export_pdf():
    if not os.path.exists(PDF_FILE):
        os.system("python3 generate_pdf_report.py")

    return FileResponse(
        path=PDF_FILE,
        filename="bankipur_election_report.pdf",
        media_type="application/pdf"
    )
