import rawDataset from "../data/extracted_data.json";

export async function fetchBankipurData() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/results?scope=all", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.respondents && data.respondents.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("FastAPI backend not reachable, falling back to static bundled dataset:", err);
  }

  // Fallback: Process static bundled dataset
  const bankipurData = (rawDataset as any[]).filter(
    (item) => item.metadata?.is_bankipur_constituency !== false && item.analysis
  );

  const videoList: any[] = [];
  const respondentList: any[] = [];
  const partyCounts: Record<string, number> = {};
  const issueCounts: Record<string, number> = {};

  bankipurData.forEach((item) => {
    const meta = item.metadata || {};
    const analysis = item.analysis || {};
    const resps = analysis.respondents || [];

    const vTitle = meta.title || "";
    const vChannel = meta.channel || "Ground Media";
    const vUrl = meta.url || "";
    const vDate = meta.upload_date || "";

    videoList.push({
      title: vTitle,
      channel: vChannel,
      url: vUrl,
      upload_date: vDate,
      respondent_count: resps.length,
      summary: analysis.overall_video_summary || "",
      is_bankipur_constituency: true,
    });

    resps.forEach((r: any) => {
      const party = r.preferred_party || "Others";
      partyCounts[party] = (partyCounts[party] || 0) + 1;

      (r.key_issues || []).forEach((issue: string) => {
        const cleanI = issue.trim();
        if (cleanI) {
          issueCounts[cleanI] = (issueCounts[cleanI] || 0) + 1;
        }
      });

      respondentList.push({
        video_title: vTitle,
        channel: vChannel,
        video_url: vUrl,
        upload_date: vDate,
        respondent_id: r.respondent_id || "",
        preferred_party: party,
        stance_certainty: r.stance_certainty || "Undecided",
        key_reason: r.key_reason || "",
        key_issues: r.key_issues || [],
        quote_original: r.quote_original || "",
        quote_english: r.quote_english || "",
        demographics_or_context: r.demographics_or_context || "",
        is_bankipur_constituency: true,
      });
    });
  });

  return {
    scope: "bankipur",
    summary_stats: {
      total_videos: videoList.length,
      total_respondents: respondentList.length,
      party_counts: partyCounts,
      issue_counts: issueCounts,
    },
    videos: videoList,
    respondents: respondentList,
  };
}
