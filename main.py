import argparse
import os
import sys
import logging
from typing import List
from dotenv import load_dotenv

load_dotenv()

from config import GEMINI_API_KEY, DEFAULT_MODEL, DEFAULT_PARTIES
from transcript_fetcher import fetch_transcript, get_playlist_video_urls
from opinion_extractor import extract_opinions_from_transcript
from excel_reporter import generate_excel_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def process_youtube_videos(
    urls: List[str],
    output_excel: str,
    parties: List[str],
    model_name: str,
    api_key: str
):
    """Processes a list of YouTube URLs/playlists and extracts opinion data to Excel."""
    expanded_urls = []
    
    for url in urls:
        url = url.strip()
        if not url:
            continue
        if "playlist" in url or "list=" in url:
            logging.info(f"Expanding playlist URL: {url}")
            p_urls = get_playlist_video_urls(url)
            logging.info(f"Extracted {len(p_urls)} video URLs from playlist.")
            expanded_urls.extend(p_urls)
        else:
            expanded_urls.append(url)

    # Deduplicate while preserving order
    seen = set()
    unique_urls = [u for u in expanded_urls if not (u in seen or seen.add(u))]

    if not unique_urls:
        logging.error("No valid YouTube URLs provided to process.")
        return

    logging.info(f"Starting opinion extraction pipeline for {len(unique_urls)} videos...")

    analyzed_results = []
    
    for idx, video_url in enumerate(unique_urls, start=1):
        logging.info(f"\n--- [{idx}/{len(unique_urls)}] Processing Video: {video_url} ---")
        
        # 1. Fetch transcript and metadata
        result = fetch_transcript(video_url)
        meta = result.get("metadata", {})
        title = meta.get("title", f"Video {idx}")
        
        if not result.get("has_transcript") or not result.get("transcript_text"):
            err_msg = result.get("error", "No transcript text retrieved.")
            logging.warning(f"Skipping LLM analysis for {title}: {err_msg}")
            analyzed_results.append({
                "metadata": meta,
                "analysis": None,
                "error": err_msg
            })
            continue

        transcript_text = result["transcript_text"]
        logging.info(f"Transcript fetched successfully ({len(transcript_text)} characters). Extracting opinions with Gemini...")

        # 2. Extract opinions using Gemini API
        analysis = extract_opinions_from_transcript(
            transcript_text=transcript_text,
            video_title=title,
            parties=parties,
            api_key=api_key,
            model_name=model_name
        )

        if analysis:
            logging.info(f"Successfully extracted {analysis.total_respondents_interviewed} respondent opinions!")
            for r in analysis.respondents:
                logging.info(f"  - {r.respondent_id}: {r.preferred_party} (Certainty: {r.stance_certainty}) | Reason: {r.key_reason[:60]}...")
        else:
            logging.error(f"Failed to analyze opinions for {title}.")

        analyzed_results.append({
            "metadata": meta,
            "analysis": analysis,
            "error": None if analysis else "Gemini extraction failed."
        })

    # 3. Export results to formatted Excel sheet
    logging.info(f"\nGenerating Excel Report: {output_excel}")
    output_path = generate_excel_report(analyzed_results, output_excel)
    logging.info(f"SUCCESS! Election Public Opinion Report saved to: {os.path.abspath(output_path)}")


def main():
    parser = argparse.ArgumentParser(description="YouTube Public Election Opinion Mining System (Gemini API)")
    parser.add_argument("--urls", nargs="+", help="YouTube video or playlist URLs to process.")
    parser.add_argument("--url-file", type=str, help="Path to text file containing YouTube URLs (one per line).")
    parser.add_argument("--output", type=str, default="election_opinions_report.xlsx", help="Output Excel file path.")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help=f"Gemini model name (default: {DEFAULT_MODEL}).")
    parser.add_argument("--parties", type=str, help="Comma-separated custom list of political parties to track.")

    args = parser.parse_args()

    # Collect URLs
    input_urls = []
    if args.urls:
        input_urls.extend(args.urls)

    if args.url_file:
        if os.path.exists(args.url_file):
            with open(args.url_file, "r", encoding="utf-8") as f:
                input_urls.extend([line.strip() for line in f if line.strip()])
        else:
            logging.error(f"URL file not found: {args.url_file}")
            sys.exit(1)

    if not input_urls:
        print("\nUsage Example:")
        print("  python main.py --urls \"https://www.youtube.com/watch?v=EXAMPLE1\" \"https://www.youtube.com/watch?v=EXAMPLE2\"")
        print("  python main.py --url-file urls.txt --output binar_opinion.xlsx\n")
        parser.print_help()
        sys.exit(1)

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logging.error("GEMINI_API_KEY environment variable is missing. Set it in .env or environment.")
        sys.exit(1)

    custom_parties = [p.strip() for p in args.parties.split(",")] if args.parties else DEFAULT_PARTIES

    process_youtube_videos(
        urls=input_urls,
        output_excel=args.output,
        parties=custom_parties,
        model_name=args.model,
        api_key=api_key
    )

if __name__ == "__main__":
    main()
