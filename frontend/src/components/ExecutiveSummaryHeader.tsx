"use client";

import React from "react";
import { TrendingUp, Users, Video, ShieldAlert, Award, FileText, Printer } from "lucide-react";

interface ExecutiveSummaryHeaderProps {
  summaryStats: {
    total_videos: number;
    total_respondents: number;
    party_counts: Record<string, number>;
    issue_counts: Record<string, number>;
  };
}

export default function ExecutiveSummaryHeader({ summaryStats }: ExecutiveSummaryHeaderProps) {
  const total = summaryStats.total_respondents || 1;
  const partyCounts = summaryStats.party_counts || {};
  
  // Sort political parties (excluding Undecided category from party ranking)
  const politicalParties = Object.entries(partyCounts)
    .filter(([p]) => !p.includes("Undecided") && !p.includes("Neutral") && !p.includes("Not a voter"))
    .sort((a, b) => b[1] - a[1]);
  
  const leader = politicalParties[0] || ["N/A", 0];
  const runnerUp = politicalParties[1] || ["N/A", 0];

  const leaderPct = ((leader[1] / total) * 100).toFixed(1);
  const runnerPct = ((runnerUp[1] / total) * 100).toFixed(1);
  const undecidedCount = (partyCounts["Undecided / Neutral"] || 0) + (partyCounts["Undecided"] || 0);
  const undecidedPct = ((undecidedCount / total) * 100).toFixed(1);

  // Top issues
  const topIssues = Object.entries(summaryStats.issue_counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);

  return (
    <div className="space-y-4">
      {/* Top Banner Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wide">
              Live Political Intelligence Brief
            </span>
            <span className="text-xs text-slate-500 font-medium">Updated Real-Time</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Bankipur & Bihar Public Opinion Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Comprehensive voter sentiment extraction across <strong className="text-slate-900">{summaryStats.total_videos} ground report videos</strong> and <strong className="text-slate-900">{summaryStats.total_respondents} interviewed citizens</strong>. Prepared for journalists, analysts, and decision-makers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.open("/report", "_blank")}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            View UI PDF Report
          </button>
          
          <button
            onClick={() => window.open("/api/export-pdf", "_blank")}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Download PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Leader Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leading Stance</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{leader[0]}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-blue-600">{leaderPct}%</span>
              <span className="text-xs text-slate-500 font-medium">({leader[1]} voters)</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Runner Up: <strong>{runnerUp[0]}</strong></span>
            <span>{runnerPct}%</span>
          </div>
        </div>

        {/* Swing Voter Index Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Swing / Undecided Index</span>
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-900">{undecidedPct}%</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-indigo-600">{undecidedCount} Citizens Open to Pitch</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Crucial determinant for final outcome
          </div>
        </div>

        {/* Total Sample Size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sample Size (N)</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{summaryStats.total_respondents}</div>
            <div className="text-xs font-medium text-emerald-600 mt-1">Verbatim Quotes Analyzed</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Across {summaryStats.total_videos} Media Field Reports
          </div>
        </div>

        {/* Primary Drivers Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Voter Issues</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 space-y-1">
            {topIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{issue}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Top agenda shaping public debate
          </div>
        </div>
      </div>

      {/* Journalist Key Takeaway Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Political Analyst Executive Insight</h3>
        </div>
        <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
          <strong>Key Finding:</strong> Ground reports reveal a <strong>two-pronged narrative shift</strong>. While the <strong className="text-amber-300">BJP</strong> maintains a solid baseline ({leaderPct}%) driven by Prime Minister Modi's brand identity and constituency loyalty, <strong className="text-cyan-300">Jan Suraaj ({runnerPct}%)</strong> has emerged as a formidable challenger, capitalizing heavily on youth frustration around <em>unemployment, exam paper leaks, and demand for governance change</em>. Over <strong>{undecidedPct}% of voters remain undecided</strong>, indicating a highly volatile swing factor.
        </p>
      </div>
    </div>
  );
}
