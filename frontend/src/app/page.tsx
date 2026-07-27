"use client";

import React, { useState, useEffect } from "react";
import { MacWindowChrome } from "../components/MacWindowChrome";
import { Sidebar } from "../components/Sidebar";
import ExecutiveSummaryHeader from "../components/ExecutiveSummaryHeader";
import AnalyticsChartsSection from "../components/AnalyticsChartsSection";
import VideoStoryArc from "../components/VideoStoryArc";
import { VoterGrid } from "../components/VoterGrid";
import { UrlPipelineForm } from "../components/UrlPipelineForm";
import { RefreshCw, BarChart2, Video, Table } from "lucide-react";

export default function Page() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/results");
      if (!res.ok) throw new Error("Failed to fetch analytical results from backend.");
      const resultData = await res.json();
      setData(resultData);
    } catch (err: any) {
      setError(err.message || "Failed to load election data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 p-3 sm:p-6 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* macOS Main Window Chrome */}
      <MacWindowChrome
        title="Election Public Opinion & Media Analytics Platform"
        onRefresh={fetchData}
        onExport={() => window.open("http://127.0.0.1:8000/api/export", "_blank")}
        isRefreshing={loading}
      >
        <div className="flex flex-col md:flex-row h-full min-h-[85vh]">
          {/* Glassmorphism Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            totalRespondents={data?.summary_stats?.total_respondents || 0}
            totalVideos={data?.summary_stats?.total_videos || 0}
          />

          {/* Main Analytics Content Container */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">
            {/* Top Navigation Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "overview"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Executive Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "videos"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Video Story Arc ({data?.videos?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("voters")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "voters"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  Voter Data Grid ({data?.respondents?.length || 0})
                </button>
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-medium flex items-center justify-between">
                <span>{error}</span>
                <button onClick={fetchData} className="underline font-bold">Retry</button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && !data && (
              <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-slate-200 rounded-2xl"></div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-24 bg-slate-200 rounded-xl"></div>
                  <div className="h-24 bg-slate-200 rounded-xl"></div>
                  <div className="h-24 bg-slate-200 rounded-xl"></div>
                  <div className="h-24 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            )}

            {/* Main Views */}
            {data && (
              <>
                {/* 1. Executive Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* Executive Summary Header */}
                    <ExecutiveSummaryHeader summaryStats={data.summary_stats} />

                    {/* Interactive Recharts Section */}
                    <AnalyticsChartsSection
                      respondents={data.respondents}
                      partyCounts={data.summary_stats.party_counts}
                      issueCounts={data.summary_stats.issue_counts}
                    />

                    {/* Ground Report Video Case Studies */}
                    <VideoStoryArc videos={data.videos} respondents={data.respondents} />

                    {/* Filterable Voter Data Grid */}
                    <VoterGrid respondents={data.respondents} />
                  </div>
                )}

                {/* 2. Video Story Arc Tab */}
                {activeTab === "videos" && (
                  <VideoStoryArc videos={data.videos} respondents={data.respondents} />
                )}

                {/* 3. Voter Micro-Data Tab */}
                {activeTab === "voters" && (
                  <VoterGrid respondents={data.respondents} />
                )}

                {/* 4. Add Pipeline Tab */}
                {activeTab === "pipeline" && (
                  <UrlPipelineForm onSuccess={fetchData} />
                )}
              </>
            )}
          </main>
        </div>
      </MacWindowChrome>
    </div>
  );
}
