"use client";

import React, { useState, useEffect } from "react";
import { Play, CheckCircle2, Clock, Activity, ExternalLink, RefreshCw, Layers, ShieldCheck, Search, Filter } from "lucide-react";

export const LiveTracker: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTag, setFilterTag] = useState<"all" | "post30" | "pre30" | "analyzed" | "queued">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/pipeline-status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.warn("Could not fetch pipeline status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // Live poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center space-x-3">
        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-700">Loading Live Pipeline Status...</span>
      </div>
    );
  }

  const curr = status?.currently_processing;
  const candidates: any[] = status?.candidates || [];
  const logs: any[] = status?.recent_logs || [];

  const totalVerified = status?.total_verified_candidates || 207;
  const post30Count = status?.post_july30_count || 137;
  const pre30Count = status?.pre_july30_count || 70;
  const analyzedCount = status?.total_analyzed_in_dataset || 0;
  const targetCount = status?.target_count || 100;
  const queueTotal = status?.queue_total || 0;
  const queueIndex = status?.current_queue_index || 0;

  const queueCompleted = status?.queue_processed_count || 0;
  const queuePercent = queueTotal > 0 ? Math.min(100, Math.round((queueCompleted / queueTotal) * 100)) : 0;
  const totalPercent = totalVerified > 0 ? Math.min(100, Math.round((analyzedCount / totalVerified) * 100)) : 0;

  // Filter candidate matrix
  const filteredCandidates = candidates.filter((c: any) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.upload_date.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTag === "post30") return c.is_post_30_july;
    if (filterTag === "pre30") return !c.is_post_30_july;
    if (filterTag === "analyzed") return c.status === "ANALYZED";
    if (filterTag === "queued") return c.status && !c.status.includes("SKIPPED") && c.status !== "ANALYZED";
    if (filterTag === "skipped") return c.status && c.status.includes("SKIPPED");

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/50">
                8 Parallel Workers Active
              </span>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md">
                56 Preserved + {queueTotal} New Videos Queue
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Bankipur Election Exit Poll & Ground Video Ingestion Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Automated 2-layer pipeline: Ingesting text transcripts and executing <strong className="text-blue-300">Gemini 2.5 Flash Multimodal Audio Analysis</strong> across all {queueTotal} unprocessed post-election & ground report videos.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/60 text-right shrink-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Verified Dataset Progress</p>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {analyzedCount} / {totalVerified} <span className="text-xs font-normal text-slate-400">Videos ({totalPercent}%)</span>
            </div>
            <div className="w-56 bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${totalPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              New Queue Batch: <strong className="text-white">{queueCompleted} / {queueTotal}</strong> Extracted in This Run ({queuePercent}%)
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Candidate Pool</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalVerified}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Verified videos found</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">July 30th+ Exit Polls</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{post30Count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Post-voting reports</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Ground Report Mood</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{pre30Count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Pre-voting interviews</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Analyzed Dataset</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{analyzedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Fully processed & saved</p>
        </div>
      </div>

      {/* Currently Processing Video Detail Card */}
      {curr ? (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-5 rounded-2xl shadow-xs space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                CURRENTLY PROCESSING VIDEO
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500">Started at {curr.started_at}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{curr.title}</h3>
              <a
                href={curr.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 shrink-0"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Channel: <strong className="text-slate-900">{curr.channel}</strong></span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Upload Date: <strong className="text-slate-900">{curr.upload_date}</strong></span>
            </div>

            <div className="mt-3 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center space-x-3">
              <Activity className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-xs font-bold text-amber-900">
                Pipeline Stage: <span className="text-amber-800 font-extrabold">{curr.stage}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Pipeline Idle or Completed</p>
          <p className="text-xs text-slate-500">All target videos processed or waiting for new queue tasks.</p>
        </div>
      )}

      {/* 207 Candidates Verified Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Verified Candidate Video Matrix ({totalVerified} Total)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live tracking status for all verified Bankipur exit poll and ground media videos.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, channel, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterTag("all")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              filterTag === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Candidates ({candidates.length})
          </button>
          <button
            onClick={() => setFilterTag("post30")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              filterTag === "post30" ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-700 hover:bg-slate-200"
            }`}
          >
            July 30th+ Exit Polls ({post30Count})
          </button>
          <button
            onClick={() => setFilterTag("pre30")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              filterTag === "pre30" ? "bg-indigo-600 text-white" : "bg-slate-100 text-indigo-700 hover:bg-slate-200"
            }`}
          >
            Ground Reports ({pre30Count})
          </button>
          <button
            onClick={() => setFilterTag("analyzed")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              filterTag === "analyzed" ? "bg-emerald-600 text-white" : "bg-slate-100 text-emerald-700 hover:bg-slate-200"
            }`}
          >
            Analyzed & Saved ({candidates.filter((c) => c.status === "ANALYZED").length})
          </button>
          <button
            onClick={() => setFilterTag("queued")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              filterTag === "queued" ? "bg-amber-600 text-white" : "bg-slate-100 text-amber-700 hover:bg-slate-200"
            }`}
          >
            Evaluated Studio Bulletins ({candidates.filter((c) => c.status && !c.status.includes("SKIPPED") && c.status !== "ANALYZED").length})
          </button>
          <button
            onClick={() => setFilterTag("skipped")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              filterTag === "skipped" ? "bg-purple-600 text-white" : "bg-slate-100 text-purple-700 hover:bg-slate-200"
            }`}
          >
            Skipped Streams ({candidates.filter((c) => c.status && c.status.includes("SKIPPED")).length})
          </button>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Video Title</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Link</th>
                <th className="py-3 px-4">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCandidates.slice(0, 100).map((c: any, idx: number) => {
                const isAnalyzed = c.status === "ANALYZED";
                const isProcessing = c.status === "PROCESSING";

                return (
                  <tr key={c.id || idx} className={isProcessing ? "bg-amber-50/80 font-bold" : "hover:bg-slate-50/80"}>
                    <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">{c.upload_date || "Unknown"}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">{c.channel}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{c.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">{c.duration_str}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-bold flex items-center space-x-1"
                      >
                        <span>Watch</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isAnalyzed && (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Analyzed & Saved</span>
                        </span>
                      )}
                      {isProcessing && (
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 text-amber-700 animate-spin" />
                          <span>Processing Now</span>
                        </span>
                      )}
                      {!isAnalyzed && !isProcessing && c.status && c.status.includes("SKIPPED") && (
                        <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                          Skipped (&gt;1 hr Live)
                        </span>
                      )}
                      {!isAnalyzed && !isProcessing && (!c.status || !c.status.includes("SKIPPED")) && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Evaluated (Studio News)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Log Console */}
      <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider text-slate-300">Live Pipeline Event Console</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-updating live</span>
        </div>

        <div className="h-48 overflow-y-auto space-y-1.5 pr-2">
          {logs.map((l: any, i: number) => (
            <div key={i} className="flex items-start space-x-2 text-[11px] leading-relaxed">
              <span className="text-slate-500 font-bold shrink-0">[{l.time}]</span>
              <span
                className={
                  l.type === "success"
                    ? "text-emerald-400 font-bold"
                    : l.type === "warning"
                    ? "text-amber-400"
                    : "text-slate-300"
                }
              >
                {l.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
