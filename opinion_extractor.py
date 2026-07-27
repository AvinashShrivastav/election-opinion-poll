import os
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, DEFAULT_MODEL, DEFAULT_PARTIES, SYSTEM_PROMPT

class RespondentOpinion(BaseModel):
    respondent_id: str = Field(description="Identifier for the interviewee, e.g., 'Respondent 1', 'Local Shopkeeper'")
    preferred_party: str = Field(description="The political party or alliance preferred by this interviewee. Must be one of the specified party list or 'Others'/'Undecided / Neutral'.")
    stance_certainty: str = Field(description="Certainty of their preference: 'Firm', 'Leaning', or 'Undecided'")
    key_reason: str = Field(description="Summary of the main reason for their opinion/vote preference.")
    key_issues: List[str] = Field(description="List of specific issues mentioned, e.g. ['Employment', 'Development', 'Corruption']")
    quote_original: str = Field(description="Direct notable statement in the original language (e.g. Hindi/Bhojpuri/English).")
    quote_english: str = Field(description="English translation of the direct quote.")
    demographics_or_context: str = Field(description="Location, gender, age, or occupation details if mentioned or discernible.")

class VideoOpinionAnalysis(BaseModel):
    video_title: str = Field(description="Title of the video being analyzed")
    total_respondents_interviewed: int = Field(description="Total number of distinct interviewees identified in this transcript")
    respondents: List[RespondentOpinion] = Field(description="List of opinions for each distinct respondent")
    overall_video_summary: str = Field(description="A 2-3 sentence overview of the general sentiment and prevailing mood in this video")


def extract_opinions_from_transcript(
    transcript_text: str,
    video_title: str,
    parties: Optional[List[str]] = None,
    api_key: Optional[str] = None,
    model_name: str = DEFAULT_MODEL
) -> Optional[VideoOpinionAnalysis]:
    """Analyzes a YouTube video transcript using Gemini API structured output."""
    key_to_use = api_key or GEMINI_API_KEY
    if not key_to_use:
        raise ValueError("GEMINI_API_KEY is missing. Please set it in .env or pass it directly.")

    client = genai.Client(api_key=key_to_use)
    party_list = parties or DEFAULT_PARTIES
    party_str = ", ".join([f"'{p}'" for p in party_list])
    formatted_system_prompt = SYSTEM_PROMPT.format(party_list=party_str)

    user_prompt = f"""
Video Title: {video_title}

Transcript Text:
{transcript_text}

Analyze the above transcript and extract all individual respondent opinions according to the required schema.
"""

    try:
        logging.info(f"Calling Gemini API ({model_name}) for transcript: {video_title}")
        response = client.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=formatted_system_prompt,
                response_mime_type="application/json",
                response_schema=VideoOpinionAnalysis,
                temperature=0.2,
            )
        )

        if response.parsed:
            return response.parsed
        elif response.text:
            return VideoOpinionAnalysis.model_validate_json(response.text)
        else:
            return None

    except Exception as e:
        logging.error(f"Gemini API error for transcript {video_title}: {e}")
        return None

def extract_opinions_from_audio(
    audio_path: str,
    video_title: str,
    parties: Optional[List[str]] = None,
    api_key: Optional[str] = None,
    model_name: str = DEFAULT_MODEL
) -> Optional[VideoOpinionAnalysis]:
    """Analyzes a YouTube video audio file directly using Gemini Multimodal Audio API."""
    key_to_use = api_key or GEMINI_API_KEY
    if not key_to_use:
        raise ValueError("GEMINI_API_KEY is missing.")

    client = genai.Client(api_key=key_to_use)
    party_list = parties or DEFAULT_PARTIES
    party_str = ", ".join([f"'{p}'" for p in party_list])
    formatted_system_prompt = SYSTEM_PROMPT.format(party_list=party_str)

    uploaded_file = None
    try:
        logging.info(f"Uploading audio file to Gemini API for video: {video_title}")
        uploaded_file = client.files.upload(file=audio_path)

        user_prompt = f"""
Video Title: {video_title}

Listen to the audio track of this ground report video and extract all individual interviewee political opinions.
"""

        logging.info(f"Calling Gemini API ({model_name}) on multimodal audio file for: {video_title}")
        response = client.models.generate_content(
            model=model_name,
            contents=[uploaded_file, user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=formatted_system_prompt,
                response_mime_type="application/json",
                response_schema=VideoOpinionAnalysis,
                temperature=0.2,
            )
        )

        if response.parsed:
            return response.parsed
        elif response.text:
            return VideoOpinionAnalysis.model_validate_json(response.text)
        else:
            return None

    except Exception as e:
        logging.error(f"Gemini API audio error for {video_title}: {e}")
        return None
    finally:
        if uploaded_file:
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass
