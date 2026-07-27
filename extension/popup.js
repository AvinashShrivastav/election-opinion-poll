document.addEventListener("DOMContentLoaded", async () => {
  const activeBlock = document.getElementById("active-video-block");
  const activeTitleEl = document.getElementById("active-title");
  const activeUrlEl = document.getElementById("active-url");
  const analyzeActiveBtn = document.getElementById("analyze-active-btn");
  const customUrlInput = document.getElementById("custom-url-input");
  const analyzeCustomBtn = document.getElementById("analyze-custom-btn");
  const openDashboardBtn = document.getElementById("open-dashboard-btn");
  const statusText = document.getElementById("status-text");

  let currentTabUrl = "";

  // Get current active tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
      currentTabUrl = tab.url;
      activeTitleEl.innerText = tab.title || "Active YouTube Video";
      activeUrlEl.innerText = tab.url;
      activeBlock.style.display = "block";
      analyzeActiveBtn.style.display = "block";
    }
  } catch (err) {
    console.log("Could not get current tab URL:", err);
  }

  function triggerAnalysis(url) {
    if (!url) {
      statusText.innerText = "Please enter a valid URL.";
      statusText.style.color = "#ef4444";
      return;
    }

    statusText.innerText = "Extracting voter opinions via AI Pipeline...";
    statusText.style.color = "#2563eb";
    analyzeActiveBtn.disabled = true;
    analyzeCustomBtn.disabled = true;

    chrome.runtime.sendMessage(
      { action: "ANALYZE_VIDEO", url: url },
      (response) => {
        analyzeActiveBtn.disabled = false;
        analyzeCustomBtn.disabled = false;

        if (response && response.success) {
          statusText.innerText = "Extraction complete! Updated in dashboard.";
          statusText.style.color = "#10b981";
        } else {
          statusText.innerText = response ? response.error : "Extraction failed.";
          statusText.style.color = "#ef4444";
        }
      }
    );
  }

  if (analyzeActiveBtn) {
    analyzeActiveBtn.addEventListener("click", () => triggerAnalysis(currentTabUrl));
  }

  if (analyzeCustomBtn) {
    analyzeCustomBtn.addEventListener("click", () => {
      const url = customUrlInput.value.trim();
      triggerAnalysis(url);
    });
  }

  if (openDashboardBtn) {
    openDashboardBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:3000" });
    });
  }
});
