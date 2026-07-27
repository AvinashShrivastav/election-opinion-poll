// Background service worker for Election Opinion Chrome Extension
const API_URL = "http://127.0.0.1:8000/api/analyze";
const SUMMARY_URL = "http://127.0.0.1:8000/api/video-summary";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ANALYZE_VIDEO") {
    (async () => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: [request.url] }),
        });

        if (response.ok) {
          const data = await response.json();
          sendResponse({ success: true, data });
        } else {
          const errorData = await response.json();
          sendResponse({ success: false, error: errorData.detail || "API server error" });
        }
      } catch (err) {
        sendResponse({ success: false, error: "Failed to connect to Election Opinion backend (http://127.0.0.1:8000)." });
      }
    })();
    return true;
  }

  if (request.action === "GET_VIDEO_SUMMARY") {
    (async () => {
      try {
        const response = await fetch(`${SUMMARY_URL}/${request.videoId}`);
        if (response.ok) {
          const data = await response.json();
          sendResponse(data);
        } else {
          sendResponse({ exists: false });
        }
      } catch (err) {
        sendResponse({ exists: false });
      }
    })();
    return true;
  }
});
