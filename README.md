# 🗳️ Election Opinion Poll & Field Media Intelligence System

> **AI-Powered Public Opinion & Exit Poll Platform for Patna Bankipur Assembly Constituency (2026)**

An end-to-end election analytics suite that ingests YouTube ground report videos, extracts structured voter testimonies using **Gemini 2.5 Flash**, renders real-time interactive Recharts visualizations, and features an in-browser Chrome extension & high-resolution UI PDF report generator.

---

## 🌟 Key Features

1. **Multimodal Voter Sentiment Extraction**:
   - **2-Layer Fail-Safe Extraction Engine**: Processes YouTube text transcripts first, automatically falling back to **Gemini Multimodal Audio API (`gemini-2.5-flash`)** if captions are missing or rate-limited.
   - Extracts voter party preferences (`BJP`, `Jan Suraaj`, `Undecided`, `RJD`, `JDU`, `Others`), stance certainty (*Firm / Leaning*), core decision motivators, key issues, and verbatim Hindi/Bhojpuri transcripts with English translations.

2. **Next.js Executive Analytics Dashboard**:
   - **Recharts Visual Analytics**: Party preference share, issue impact ranking, chronological sentiment trends, demographic donut charts, and **Media House Coverage & Bias Breakdown** (*ABP Live, Live Cities, Bharat Prime, Dainik Bhaskar, News24*).
   - **Video Intelligence Gallery**: Card explorer with expandable voter testimonies for all 42 Bankipur ground report videos ($N = 393$ voters).

3. **YouTube Chrome Extension**:
   - Manifest V3 Chrome Extension (`extension/`) injecting **"＋ Add to Election Pipeline"** buttons and live **"📊 Analyzed (10 Voters)"** badges directly into YouTube watch pages and search results.

4. **UI PDF Master Report Engine**:
   - Print-optimized report generator at `/report` rendering high-resolution UI graphics, complete video archives, and verbatim voter quotes cited with direct YouTube video links.

---

## 🚀 Quick Start

### 1. Backend Server Setup (FastAPI)

```bash
# Clone the repository
git clone https://github.com/AvinashShrivastav/election-opinion-poll.git
cd election-opinion-poll

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create .env file with your Gemini API key
echo 'GEMINI_API_KEY="YOUR_GEMINI_API_KEY"' > .env

# Start FastAPI backend server
uvicorn server:app --host 127.0.0.1 --port 8000
```

### 2. Frontend App Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🛠️ Chrome Extension Installation

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top right).
3. Click **Load unpacked** and select the `extension/` directory.
4. Open any Bihar election ground report on YouTube to see live opinion summary badges and the **"＋ Add to Election Pipeline"** button!

---

## 📂 Project Architecture

```
election_opinion/
├── server.py                   # FastAPI backend server with dynamic dataset hot-reload
├── opinion_extractor.py        # Gemini SDK Pydantic structured output extractor
├── transcript_fetcher.py       # YouTube subtitle & yt-dlp audio fetcher
├── excel_reporter.py           # Multi-tab Excel report generator
├── generate_pdf_report.py      # PDF report compiler
├── extracted_data.json         # Master database (42 Bankipur Videos / 393 Voters)
├── frontend/                   # Next.js 16 Web Dashboard Application
│   ├── src/app/page.tsx        # Main Analytics Dashboard
│   ├── src/app/report/page.tsx # UI PDF Master Report Page
│   └── src/components/        # Recharts & UI Components
└── extension/                  # Chrome Manifest V3 Extension
    ├── manifest.json
    ├── content.js
    └── background.js
```
