"use client";

import React, { useState, useEffect } from "react";
import ExecutiveSummaryHeader from "../../components/ExecutiveSummaryHeader";
import AnalyticsChartsSection from "../../components/AnalyticsChartsSection";
import { Printer, ArrowLeft, ExternalLink, Quote, PlaySquare, Calendar, Users, Filter, Search } from "lucide-react";

export default function PrintableReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/results?scope=bankipur")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading report data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Loading Complete Bankipur Voter Database ({data?.respondents?.length || "393"} Voters)...</p>
        </div>
      </div>
    );
  }

  const respondents = data.respondents || [];
  const videos = data.videos || [];
  const stats = data.summary_stats || {};

  // Filtered videos if search is used
  const filteredVideos = videos.filter((v: any) => {
    const q = searchTerm.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      (v.channel || "").toLowerCase().includes(q) ||
      (v.summary || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans print:bg-white print:p-0 p-4 md:p-8">
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="max-w-6xl mx-auto mb-6 print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => window.location.href = "/"}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Filter Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report testimonies..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save Full PDF
          </button>
        </div>
      </div>

      {/* Main Document Container (Print Optimized) */}
      <div className="max-w-6xl mx-auto bg-white p-6 md:p-12 rounded-3xl border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 space-y-10">
        
        {/* Cover Title Banner */}
        <div className="border-b-2 border-slate-900 pb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-md uppercase tracking-wider">
              Comprehensive Field Master Report
            </span>
            <span className="text-xs text-slate-500 font-semibold">Bankipur Constituency 2026</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            VOICE OF BANKIPUR 2026: Complete Voter Testimony & Media Intelligence Compendium
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            An Uncut Field Master Archive containing <strong>ALL {stats.total_videos} Ground Report Videos</strong> and <strong>ALL {stats.total_respondents} Verbatim Citizen Testimonies</strong> recorded across Bankipur, Patna.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 font-semibold border-t border-slate-100">
            <span>Date: July 2026</span>
            <span>Total Media Videos: <strong>{stats.total_videos} Reports</strong></span>
            <span>Total Interviewed Voters: <strong>N = {stats.total_respondents} Citizens</strong></span>
            <span>Scope: <strong>Bankipur Assembly Seat Only</strong></span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3">
            1. Executive Summary & Electoral Dynamics
          </h2>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs md:text-sm text-slate-700 leading-relaxed">
            <p>
              Welcome to the complete voter intelligence compendium for the <strong>Bankipur (बांकीपुर) Assembly Constituency</strong> in Patna, Bihar. 
              This document contains the <strong>complete dataset of all {stats.total_videos} field report videos</strong> and <strong>all {stats.total_respondents} verbatim voter interviews</strong> conducted across Kadamkuan, PMCH, Hathwa Market, Nala Road, Rajendra Nagar, and local commercial hubs.
            </p>

            <p>
              <strong>The Core Story of this Election:</strong><br/>
              Bankipur has traditionally been considered a safe fortress for the <strong>BJP</strong>, led by 10-year incumbent MLA Nitin Navin. However, ground reporting reveals a major undercurrent of change. 
              While the <strong>BJP holds a leading preference share of 39.7% (156 voters)</strong> driven by Prime Minister Modi's national brand identity and long-term constituency loyalty, 
              Prashant Kishor's <strong>Jan Suraaj</strong> has emerged as a powerhouse challenger with <strong>26.7% (105 voters)</strong>.
            </p>

            <p>
              Jan Suraaj is capturing strong momentum among educated youth, students, and merchants who are deeply frustrated by <strong>exam paper leaks, student lathi-charges, unemployment, and candidate complacency</strong>. 
              Crucially, <strong>22.9% (90 voters) remain undecided</strong>, indicating that the election is far from settled and will be decided by late campaign momentum.
            </p>
          </div>
        </div>

        {/* Section 2: Recharts Analytics Charts (High-Res UI Graphics) */}
        <div className="space-y-6 print:break-before-page">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3">
            2. High-Resolution Visual Analytics & Media House Split
          </h2>

          <AnalyticsChartsSection
            respondents={respondents}
            partyCounts={stats.party_counts || {}}
            issueCounts={stats.issue_counts || {}}
          />
        </div>

        {/* Section 3: All 42 Videos & All 393 Voter Testimonies */}
        <div className="space-y-8 print:break-before-page">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 border-l-4 border-blue-600 pl-3">
                3. Complete Video Master Archive ({filteredVideos.length} Videos • {stats.total_respondents} Voter Quotes)
              </h2>
              <p className="text-xs text-slate-500 mt-1 pl-4">
                Full uncensored transcripts, party stances, key reasons, and direct YouTube video links for all ground reports.
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg print:hidden">
              Displaying {filteredVideos.length} of {videos.length} Videos
            </span>
          </div>

          <div className="space-y-8">
            {filteredVideos.map((video: any, vIdx: number) => {
              const videoResps = respondents.filter((r: any) => r.video_url === video.url);

              const partyCounts: Record<string, number> = {};
              videoResps.forEach((r: any) => {
                partyCounts[r.preferred_party] = (partyCounts[r.preferred_party] || 0) + 1;
              });

              return (
                <div
                  key={vIdx}
                  className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 print:break-inside-avoid print:border-slate-300"
                >
                  {/* Video Header Bar */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg">
                          <PlaySquare className="w-3.5 h-3.5" />
                          {video.channel || "Ground Media Outlet"}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          {video.upload_date}
                        </span>
                        <span className="flex items-center gap-1 font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {video.respondent_count} Interviewed Citizens
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {vIdx + 1}. {video.title}
                      </h3>

                      {video.summary && (
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <strong className="text-slate-900">Media Report Summary:</strong> "{video.summary}"
                        </p>
                      )}

                      {/* Party Breakdown Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Voter Split:</span>
                        {Object.entries(partyCounts).map(([party, count], pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <span>{party}</span>
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-md font-extrabold text-[10px]">
                              {count}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* YouTube Watch Link */}
                    <div className="shrink-0 pt-1 md:pt-0">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        Watch YouTube Video
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      </a>
                    </div>
                  </div>

                  {/* All Verbatim Voter Quotes for This Video */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Verbatim Voter Testimonies ({videoResps.length} Interviewees)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videoResps.map((r: any, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{r.respondent_id}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[10px] rounded-md">
                                  {r.preferred_party}
                                </span>
                                <span className="px-1.5 py-0.5 bg-white text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200">
                                  {r.stance_certainty}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-medium text-slate-800 leading-relaxed">
                              <strong>Core Motivation:</strong> {r.key_reason}
                            </p>

                            {r.quote_original && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 italic space-y-1">
                                <div className="flex gap-1.5">
                                  <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <p className="not-italic font-medium">"{r.quote_original}"</p>
                                </div>
                                {r.quote_english && (
                                  <p className="text-[11px] text-slate-500 not-italic border-l-2 border-blue-400 pl-2 mt-1">
                                    Translation: "{r.quote_english}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {r.key_issues && r.key_issues.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200">
                              {r.key_issues.map((issue: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white text-slate-600 text-[10px] font-medium rounded-md border border-slate-200"
                                >
                                  {issue}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Document Note */}
        <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Bankipur Assembly Election Exit Poll & Field Intelligence Master Compendium</p>
        </div>
      </div>
    </div>
  );
}
