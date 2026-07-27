"use client";

import React, { useState } from "react";
import { PlaySquare, Calendar, Users, ExternalLink, Quote, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface VideoSummary {
  title: string;
  channel: string;
  url: string;
  upload_date: string;
  respondent_count: number;
  summary: string;
}

interface Respondent {
  video_title: string;
  video_url: string;
  respondent_id: string;
  preferred_party: string;
  stance_certainty: string;
  key_reason: string;
  key_issues: string[];
  quote_original: string;
  quote_english: string;
  demographics_or_context: string;
}

interface VideoStoryArcProps {
  videos: VideoSummary[];
  respondents: Respondent[];
}

export default function VideoStoryArc({ videos, respondents }: VideoStoryArcProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedVideoUrl, setExpandedVideoUrl] = useState<string | null>(
    videos.length > 0 ? videos[0].url : null
  );

  const filteredVideos = videos.filter((v) => {
    const query = searchTerm.toLowerCase();
    return (
      v.title.toLowerCase().includes(query) ||
      (v.channel || "").toLowerCase().includes(query) ||
      (v.summary || "").toLowerCase().includes(query)
    );
  });

  const toggleExpand = (url: string) => {
    setExpandedVideoUrl(expandedVideoUrl === url ? null : url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md uppercase">
              Field Report Case Studies ({videos.length})
            </span>
            <span className="text-xs text-slate-500 font-medium">Bankipur Constituency Ground Media</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Video Intelligence & Narrative Explorer</h2>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ground report stories..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="space-y-4">
        {filteredVideos.map((video, vIdx) => {
          const isExpanded = expandedVideoUrl === video.url;
          const videoResps = respondents.filter((r) => r.video_url === video.url);

          const partyCounts: Record<string, number> = {};
          videoResps.forEach((r) => {
            partyCounts[r.preferred_party] = (partyCounts[r.preferred_party] || 0) + 1;
          });

          return (
            <div
              key={vIdx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Card Main Info Bar */}
              <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg">
                      <PlaySquare className="w-3.5 h-3.5" />
                      {video.channel || "Ground Media Outlet"}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {video.upload_date}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {video.respondent_count} Voters Interviewed
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{video.title}</h3>

                  {/* Video Executive Narrative */}
                  {video.summary && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong className="text-slate-800">Media Story Narrative:</strong> "{video.summary}"
                    </p>
                  )}

                  {/* Party Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Object.entries(partyCounts).map(([party, count], pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>{party}</span>
                        <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-md font-extrabold text-[10px]">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Watch YouTube
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  </a>

                  <button
                    onClick={() => toggleExpand(video.url)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <span>{isExpanded ? "Hide Voter Quotes" : "View Voter Quotes"}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable Voter Testimony Grid */}
              {isExpanded && (
                <div className="bg-slate-50/80 p-5 border-t border-slate-200 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Verbatim Voter Testimony ({videoResps.length} Interviewees)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoResps.map((r, rIdx) => (
                      <div
                        key={rIdx}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{r.respondent_id}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[10px] rounded-md">
                                {r.preferred_party}
                              </span>
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200">
                                {r.stance_certainty}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            <strong>Core Motivation:</strong> {r.key_reason}
                          </p>

                          {r.quote_original && (
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 italic space-y-1">
                              <div className="flex gap-1.5">
                                <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <p>"{r.quote_original}"</p>
                              </div>
                              {r.quote_english && (
                                <p className="text-[11px] text-slate-500 font-normal not-italic pl-4 border-l-2 border-blue-300 mt-1">
                                  Translation: "{r.quote_english}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {r.key_issues && r.key_issues.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                            {r.key_issues.map((issue, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
