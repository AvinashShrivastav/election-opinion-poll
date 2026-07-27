"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface Respondent {
  video_title: string;
  channel: string;
  preferred_party: string;
  stance_certainty: string;
  key_issues: string[];
  upload_date: string;
  demographics_or_context?: string;
}

interface AnalyticsChartsSectionProps {
  respondents: Respondent[];
  partyCounts: Record<string, number>;
  issueCounts: Record<string, number>;
}

const PIE_COLORS = ["#0284c7", "#f97316", "#16a34a", "#64748b", "#8b5cf6", "#e11d48"];

export default function AnalyticsChartsSection({
  respondents,
  partyCounts,
  issueCounts,
}: AnalyticsChartsSectionProps) {
  // 1. Process Party vs Certainty Stacked Data
  const partyCertaintyMap: Record<string, { Firm: number; Leaning: number; Undecided: number }> = {};
  
  respondents.forEach((r) => {
    const party = r.preferred_party || "Others";
    if (!partyCertaintyMap[party]) {
      partyCertaintyMap[party] = { Firm: 0, Leaning: 0, Undecided: 0 };
    }
    const certainty = r.stance_certainty || "Undecided";
    if (certainty.includes("Firm")) {
      partyCertaintyMap[party].Firm += 1;
    } else if (certainty.includes("Lean")) {
      partyCertaintyMap[party].Leaning += 1;
    } else {
      partyCertaintyMap[party].Undecided += 1;
    }
  });

  const stackedBarData = Object.entries(partyCertaintyMap).map(([party, counts]) => ({
    party,
    Firm: counts.Firm,
    Leaning: counts.Leaning,
    Undecided: counts.Undecided,
    total: counts.Firm + counts.Leaning + counts.Undecided,
  })).sort((a, b) => b.total - a.total);

  // 2. Process Issue Ranking Data
  const issueData = Object.entries(issueCounts)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  // 3. Process Media House Attention Data
  const mediaHouseMap: Record<string, { totalVoters: number; BJP: number; "Jan Suraaj": number; Undecided: number; Others: number }> = {};

  respondents.forEach((r) => {
    let rawChannel = (r.channel || "Independent / Local").trim();
    if (!rawChannel) rawChannel = "Independent Media";
    
    // Clean common channel names
    let channel = rawChannel;
    if (channel.includes("ABP")) channel = "ABP Live / News";
    else if (channel.includes("Live Cities")) channel = "Live Cities";
    else if (channel.includes("Bharat Prime")) channel = "Bharat Prime";
    else if (channel.includes("Bhaskar")) channel = "Dainik Bhaskar";
    else if (channel.includes("News24")) channel = "News24";

    if (!mediaHouseMap[channel]) {
      mediaHouseMap[channel] = { totalVoters: 0, BJP: 0, "Jan Suraaj": 0, Undecided: 0, Others: 0 };
    }

    mediaHouseMap[channel].totalVoters += 1;

    const party = r.preferred_party || "Others";
    if (party === "BJP") mediaHouseMap[channel].BJP += 1;
    else if (party === "Jan Suraaj") mediaHouseMap[channel]["Jan Suraaj"] += 1;
    else if (party.includes("Undecided") || party.includes("Neutral")) mediaHouseMap[channel].Undecided += 1;
    else mediaHouseMap[channel].Others += 1;
  });

  const mediaHouseData = Object.entries(mediaHouseMap)
    .map(([channel, counts]) => ({
      channel,
      totalVoters: counts.totalVoters,
      BJP: counts.BJP,
      "Jan Suraaj": counts["Jan Suraaj"],
      Undecided: counts.Undecided,
      Others: counts.Others,
    }))
    .sort((a, b) => b.totalVoters - a.totalVoters)
    .slice(0, 8);

  // 4. Process Timeline Trend Data
  const dateMap: Record<string, Record<string, number>> = {};
  respondents.forEach((r) => {
    const rawDate = r.upload_date || "Unknown";
    let formattedDate = rawDate;
    if (rawDate.length === 8) {
      formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    }
    if (!dateMap[formattedDate]) {
      dateMap[formattedDate] = {};
    }
    const party = r.preferred_party || "Others";
    dateMap[formattedDate][party] = (dateMap[formattedDate][party] || 0) + 1;
  });

  const timelineData = Object.entries(dateMap)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, counts]) => ({
      date,
      BJP: counts["BJP"] || 0,
      "Jan Suraaj": counts["Jan Suraaj"] || 0,
      Undecided: (counts["Undecided / Neutral"] || 0) + (counts["Undecided"] || 0),
    }));

  // 5. Demographic Breakdown Data
  const demoCounts: Record<string, number> = {
    Youth: 0,
    "Older Adults": 0,
    "Shopkeepers / Business": 0,
    "Students / Jobseekers": 0,
    "General Public": 0,
  };

  respondents.forEach((r) => {
    const demo = (r.demographics_or_context || "").toLowerCase();
    if (demo.includes("youth") || demo.includes("young") || demo.includes("युवा")) {
      demoCounts["Youth"] += 1;
    } else if (demo.includes("older") || demo.includes("senior") || demo.includes("uncle") || demo.includes("बुजुर्ग")) {
      demoCounts["Older Adults"] += 1;
    } else if (demo.includes("shop") || demo.includes("business") || demo.includes("व्यापारी")) {
      demoCounts["Shopkeepers / Business"] += 1;
    } else if (demo.includes("student") || demo.includes("छात्र")) {
      demoCounts["Students / Jobseekers"] += 1;
    } else {
      demoCounts["General Public"] += 1;
    }
  });

  const pieData = Object.entries(demoCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Political Sentiment & Media Analytics</h2>
          <p className="text-xs text-slate-500">Interactive charts powered by verbatim field analysis</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
          <span>N = {respondents.length} Bankipur Voters</span>
        </div>
      </div>

      {/* Media House Attention Graph (NEW) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Media House Coverage Volume & Party Preference Split</h3>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Media Outlet Share
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Which media outlets are covering Bankipur most heavily & the party preference captured in their ground reports
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mediaHouseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "#475569" }} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="BJP" fill="#f97316" stackId="m" name="BJP Voters" />
              <Bar dataKey="Jan Suraaj" fill="#0284c7" stackId="m" name="Jan Suraaj Voters" />
              <Bar dataKey="Undecided" fill="#64748b" stackId="m" name="Undecided Voters" />
              <Bar dataKey="Others" fill="#8b5cf6" stackId="m" radius={[4, 4, 0, 0]} name="Others / Allies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Stacked Bar Chart & Issue Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Party Vote Share & Certainty */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Party Preference & Stance Certainty Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Firm vs Leaning vs Undecided supporters per political party</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="party" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Firm" fill="#2563eb" stackId="a" name="Firm Supporter" />
                <Bar dataKey="Leaning" fill="#38bdf8" stackId="a" name="Leaning" />
                <Bar dataKey="Undecided" fill="#cbd5e1" stackId="a" radius={[4, 4, 0, 0]} name="Soft / Undecided" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Impact Ranking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top Decisive Voter Issues Impacting Choice</h3>
            <p className="text-xs text-slate-500 mb-4">Ranked by frequency of verbatim voter mentions</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis dataKey="issue" type="category" tick={{ fontSize: 11, fill: "#475569" }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} name="Voter Mentions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Timeline Trend Line & Demographic Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Trend Line (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Chronological Voter Preference Trend</h3>
            <p className="text-xs text-slate-500 mb-4">Tracking sentiment progression across media report dates</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="BJP" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="BJP" />
                <Line type="monotone" dataKey="Jan Suraaj" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} name="Jan Suraaj" />
                <Line type="monotone" dataKey="Undecided" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Undecided" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographic Breakdown (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Interviewed Voter Demographics</h3>
            <p className="text-xs text-slate-500 mb-2">Age, profession & social group context</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
