import re
import time
import logging
from typing import List, Dict, Optional
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Mode': 'navigate'
}

def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various YouTube URL formats."""
    patterns = [
        r"(?:v=|\/vi\/|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([^#\&\?]*)"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match and len(match.group(1)) == 11:
            return match.group(1)
    return None

def get_playlist_video_urls(playlist_url: str) -> List[str]:
    """Extract all video URLs from a YouTube playlist URL using yt-dlp."""
    ydl_opts = {
        'extract_flat': True,
        'skip_download': True,
        'quiet': True,
        'http_headers': BROWSER_HEADERS
    }
    video_urls = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(playlist_url, download=False)
            if 'entries' in info:
                for entry in info['entries']:
                    if entry and 'id' in entry:
                        video_urls.append(f"https://www.youtube.com/watch?v={entry['id']}")
            elif 'id' in info and len(info['id']) == 11:
                video_urls.append(f"https://www.youtube.com/watch?v={info['id']}")
        except Exception as e:
            logging.error(f"Error fetching playlist info for {playlist_url}: {e}")
    return video_urls

def get_video_metadata(video_url: str) -> Dict:
    """Fetch video metadata (title, channel, upload date, duration)."""
    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'http_headers': BROWSER_HEADERS
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=False)
            return {
                "id": info.get("id", ""),
                "title": info.get("title", "Unknown Title"),
                "channel": info.get("uploader", info.get("channel", "Unknown Channel")),
                "upload_date": info.get("upload_date", ""),
                "duration": info.get("duration", 0),
                "url": video_url
            }
        except Exception as e:
            logging.error(f"Error fetching metadata for {video_url}: {e}")
            video_id = extract_video_id(video_url) or "unknown"
            return {
                "id": video_id,
                "title": f"Video ({video_id})",
                "channel": "Unknown",
                "upload_date": "",
                "duration": 0,
                "url": video_url
            }

def fetch_transcript(video_url: str) -> Optional[Dict]:
    """
    Fetch the transcript and metadata for a YouTube video.
    Returns dict with keys: 'metadata', 'transcript_text', 'has_transcript', 'error'
    """
    video_id = extract_video_id(video_url)
    if not video_id:
        return {
            "metadata": {"url": video_url, "title": "Invalid URL", "channel": "", "id": ""},
            "transcript_text": "",
            "has_transcript": False,
            "error": "Could not parse YouTube video ID from URL."
        }

    metadata = get_video_metadata(video_url)
    languages = ['hi', 'hi-Latn', 'en', 'bho', 'mr', 'bn', 'gu', 'ta', 'te']
    
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        
        fetched = None
        try:
            t = transcript_list.find_transcript(languages)
            fetched = t.fetch()
        except Exception:
            try:
                t = transcript_list.find_generated_transcript(languages)
                fetched = t.fetch()
            except Exception:
                for t in transcript_list:
                    fetched = t.fetch()
                    break

        if fetched:
            full_text = " ".join([snippet.text for snippet in fetched])
            return {
                "metadata": metadata,
                "transcript_text": full_text,
                "has_transcript": True,
                "error": None
            }
            
    except (TranscriptsDisabled, NoTranscriptFound) as e:
        logging.warning(f"No transcript found via API for {video_id}. Attempting yt-dlp fallback...")
    except Exception as e:
        logging.warning(f"YouTube transcript API info for {video_id}: {e}")

    # Fallback to yt-dlp subtitle extraction with browser headers
    return fetch_transcript_ytdlp_fallback(video_url, metadata)

def fetch_transcript_ytdlp_fallback(video_url: str, metadata: Dict) -> Dict:
    """Fallback method to extract automatic or manual subtitles using yt-dlp."""
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['hi', 'en', 'bho'],
        'quiet': True,
        'http_headers': BROWSER_HEADERS
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=False)
            requested_subs = info.get('requested_subtitles')
            if requested_subs:
                sub_text = ""
                for lang, sub_info in requested_subs.items():
                    if 'data' in sub_info:
                        sub_text += sub_info['data'] + " "
                if sub_text.strip():
                    return {
                        "metadata": metadata,
                        "transcript_text": sub_text.strip(),
                        "has_transcript": True,
                        "error": None
                    }
        except Exception as e:
            logging.error(f"yt-dlp subtitle fallback failed for {video_url}: {e}")

    return {
        "metadata": metadata,
        "transcript_text": "",
        "has_transcript": False,
        "error": "No subtitles/transcripts available for this video."
    }
