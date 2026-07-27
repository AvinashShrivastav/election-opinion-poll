import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Default political parties to track
DEFAULT_PARTIES = [
    "BJP",
    "Jan Suraaj",
    "RJD",
    "JDU",
    "Congress",
    "Mahagathbandhan (Alliance)",
    "NDA (Alliance)",
    "Others",
    "Undecided / Neutral"
]

# Default Gemini model
DEFAULT_MODEL = "gemini-2.5-flash"

# System prompt for structured extraction
SYSTEM_PROMPT = """You are an expert political analyst and data extraction specialist.
Your task is to analyze YouTube ground-report video transcripts where members of the public are interviewed about their political opinions, voting preferences, and views on political parties/candidates.

Carefully read the transcript and identify EVERY DISTINCT interviewee / speaker whose opinion is sought.

For EACH interviewee / respondent, extract:
1. Speaker Number / Identifier (e.g. Respondent 1, Respondent 2)
2. Preferred Political Party: Categorize their choice into one of the following exact options:
   {party_list}
3. Stance Certainty: 'Firm', 'Leaning', or 'Undecided'
4. Key Reason / Sentiment Summary: A concise explanation of why they support or oppose a party/candidate.
5. Key Issues Mentioned: List specific issues brought up by this respondent (e.g. Employment/Jobs, Development/Infrastructure, Inflation/Prices, Corruption, Law & Order, Caste/Community, Education, Local Candidate, Change/Badlav, etc.)
6. Direct Quote / Notable Statement: A key representative quote in the original language (e.g. Hindi/Bhojpuri/English) along with a brief English translation.
7. Demographics / Context: Any location, gender, age group, or occupation details mentioned or clearly evident in the context.

Guidelines:
- If a person expresses views for multiple parties or changes their mind, determine their final leaning.
- Do NOT confuse the interviewer/reporter with an interviewee. Ignore the reporter's questions or comments except for context.
- Be objective and faithful to the transcript text. Do not hallucinate respondents.
"""
