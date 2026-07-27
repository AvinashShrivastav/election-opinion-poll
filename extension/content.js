// Content Script for YouTube Injection with Live Results Preview
(function () {
  console.log("Election Opinion Pipeline Extension with Injected Results loaded on YouTube");

  function extractVideoId(url) {
    const match = url.match(/(?:v=|\/vi\/|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([^#\&\?]*)/);
    return match && match[1].length === 11 ? match[1] : null;
  }

  function showToast(message, isError = false) {
    const existing = document.getElementById("mac-pipeline-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "mac-pipeline-toast";
    toast.className = "mac-pipeline-toast";
    toast.innerHTML = `
      <div style="width: 20px; height: 20px; border-radius: 50%; background: ${isError ? '#ef4444' : '#2563eb'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">
        ${isError ? '✕' : '✓'}
      </div>
      <div>
        <div style="font-weight: 600; color: #1e293b;">Election Opinion Pipeline</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${message}</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast) toast.remove();
    }, 4500);
  }

  // Injected Overlay Modal directly inside YouTube UI
  function openSummaryModal(summaryData) {
    const existingModal = document.getElementById("mac-summary-modal");
    if (existingModal) existingModal.remove();

    const overlay = document.createElement("div");
    overlay.id = "mac-summary-modal";
    overlay.className = "mac-modal-overlay";

    const partyBadges = Object.entries(summaryData.party_counts || {})
      .map(([p, count]) => `<span style="background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #bfdbfe;">${p}: ${count}</span>`)
      .join(" ");

    const respondentItems = (summaryData.respondents || []).map(r => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 12px; color: #0f172a;">${r.respondent_id || 'Respondent'}</strong>
          <span style="background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${r.preferred_party}</span>
        </div>
        <p style="font-size: 11px; color: #334155; margin-bottom: 4px;">${r.key_reason || ''}</p>
        ${r.quote_original ? `<p style="font-size: 10px; color: #64748b; font-style: italic;">"${r.quote_original}"</p>` : ''}
      </div>
    `).join("");

    overlay.innerHTML = `
      <div class="mac-modal-card">
        <div class="mac-modal-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></div>
            <span style="font-size: 12px; font-weight: 700; color: #1e293b; margin-left: 6px;">Voter Opinion Analytics</span>
          </div>
          <button id="mac-modal-close-btn" style="background: none; border: none; font-size: 16px; color: #64748b; cursor: pointer; font-weight: bold;">✕</button>
        </div>

        <div class="mac-modal-body">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${summaryData.title}</h3>
            <p style="font-size: 11px; color: #64748b;">Total Extracted Interviewees: <strong>${summaryData.total_respondents} voters</strong></p>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Party Preferences in this Video</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">${partyBadges}</div>
          </div>

          ${summaryData.summary ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; font-size: 11px; color: #166534; leading-relaxed: true;">
              <strong>Overall Video Summary:</strong> "${summaryData.summary}"
            </div>
          ` : ''}

          <div>
            <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Extracted Voter Responses (${summaryData.respondents ? summaryData.respondents.length : 0})</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">${respondentItems}</div>
          </div>

          <div style="display: flex; justify-end: true; margin-top: 6px;">
            <button id="mac-modal-dashboard-btn" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Open Full Dashboard
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("mac-modal-close-btn").onclick = () => overlay.remove();
    document.getElementById("mac-modal-dashboard-btn").onclick = () => {
      window.open("http://localhost:3000", "_blank");
      overlay.remove();
    };
  }

  function sendToPipeline(videoUrl, buttonEl, container) {
    if (!videoUrl) return;

    buttonEl.disabled = true;
    buttonEl.innerText = "Analyzing via Gemini...";

    showToast("Transcribing & extracting voter opinions with Gemini...");

    chrome.runtime.sendMessage(
      { action: "ANALYZE_VIDEO", url: videoUrl },
      (response) => {
        if (response && response.success) {
          showToast("Voter opinions extracted successfully! Data added to Pipeline.");
          const videoId = extractVideoId(videoUrl);
          if (videoId) {
            checkAndRenderVideoResult(videoId, container, videoUrl);
          }
        } else {
          buttonEl.disabled = false;
          buttonEl.innerText = "＋ Add to Pipeline";
          const err = response ? response.error : "Unknown error";
          showToast(`Extraction failed: ${err}`, true);
        }
      }
    );
  }

  function checkAndRenderVideoResult(videoId, container, videoUrl) {
    chrome.runtime.sendMessage(
      { action: "GET_VIDEO_SUMMARY", videoId: videoId },
      (res) => {
        if (res && res.exists) {
          // Video is ALREADY analyzed! Render the opinion summary pill
          const existingBtn = container.querySelector(".mac-pipeline-btn, .mac-summary-pill");
          if (existingBtn) existingBtn.remove();

          const pill = document.createElement("div");
          pill.className = "mac-summary-pill";
          
          const topParties = Object.entries(res.party_counts || {})
            .slice(0, 2)
            .map(([p, c]) => `${p}: ${c}`)
            .join(" • ");

          pill.innerHTML = `
            <span class="mac-summary-tag">📊 Analyzed (${res.total_respondents})</span>
            <span>${topParties || 'View Breakdown'}</span>
          `;

          pill.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openSummaryModal(res);
          };

          container.appendChild(pill);
        } else {
          // Video not analyzed yet! Render Add to Pipeline button
          const existingBtn = container.querySelector(".mac-pipeline-btn, .mac-summary-pill");
          if (existingBtn) return;

          const btn = document.createElement("button");
          btn.className = "mac-pipeline-btn";
          btn.innerHTML = `<span>＋ Add to Pipeline</span>`;
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendToPipeline(videoUrl, btn, container);
          };

          container.appendChild(btn);
        }
      }
    );
  }

  // 1. Inject on Video Watch Page
  function injectWatchPage() {
    if (!window.location.href.includes("/watch")) return;
    const videoId = extractVideoId(window.location.href);
    if (!videoId) return;

    const targetMenu = document.querySelector("#top-level-buttons-computed") || document.querySelector("#menu-container");
    if (!targetMenu) return;

    if (targetMenu.getAttribute("data-mac-injected") === videoId) return;
    targetMenu.setAttribute("data-mac-injected", videoId);

    checkAndRenderVideoResult(videoId, targetMenu, window.location.href);
  }

  // 2. Inject on Search Results Page
  function injectSearchResults() {
    if (!window.location.href.includes("/results")) return;

    const videoCards = document.querySelectorAll("ytd-video-renderer");
    videoCards.forEach((card) => {
      const titleLink = card.querySelector("a#video-title");
      if (!titleLink || !titleLink.href) return;

      const videoUrl = titleLink.href;
      const videoId = extractVideoId(videoUrl);
      if (!videoId) return;

      const container = card.querySelector("#metadata-line") || card.querySelector("#title-wrapper");
      if (!container) return;

      if (container.getAttribute("data-mac-injected") === videoId) return;
      container.setAttribute("data-mac-injected", videoId);

      checkAndRenderVideoResult(videoId, container, videoUrl);
    });
  }

  const observer = new MutationObserver(() => {
    injectWatchPage();
    injectSearchResults();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial execution
  injectWatchPage();
  injectSearchResults();
})();
