"use client";

import React, { useState } from "react";
import { Search, ExternalLink, Quote, Filter } from "lucide-react";

export interface Respondent {
  video_title: string;
  channel: string;
  video_url: string;
  upload_date: string;
  respondent_id: string;
  preferred_party: string;
  stance_certainty: string;
  key_reason: string;
  key_issues: string[];
  quote_original: string;
  quote_english: string;
  demographics_or_context: string;
}

interface VoterGridProps {
  respondents: Respondent[];
}

export const VoterGrid: React.FC<VoterGridProps> = ({ respondents }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState("ALL");

  const partyList = ["ALL", ...Array.from(new Set(respondents.map((r) => r.preferred_party)))];

  const filtered = respondents.filter((r) => {
    const matchesSearch =
      r.respondent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.key_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.quote_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.video_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesParty = selectedParty === "ALL" || r.preferred_party === selectedParty;

    return matchesSearch && matchesParty;
  });

  return (
    <div className="mac-card p-5 border border-slate-200/80">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Voter Opinions & Stances</h2>
          <p className="text-xs text-slate-500 mt-0.5">Micro-data extracted per respondent ({filtered.length} shown)</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotes, reasons, or videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 w-56 transition-all"
            />
          </div>

          {/* Party Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              {partyList.map((p) => (
                <option key={p} value={p}>
                  {p === "ALL" ? "All Parties" : p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="py-2.5 px-3">Respondent</th>
              <th className="py-2.5 px-3">Preferred Party</th>
              <th className="py-2.5 px-3">Stance Certainty</th>
              <th className="py-2.5 px-3">Key Reason / Sentiment</th>
              <th className="py-2.5 px-3">Notable Quote</th>
              <th className="py-2.5 px-3">Key Issues</th>
              <th className="py-2.5 px-3 text-right">Source Video</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No voter records match your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 align-top">
                    <span className="font-bold text-slate-900 block">{r.respondent_id}</span>
                    {r.demographics_or_context && (
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{r.demographics_or_context}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 align-top">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {r.preferred_party}
                    </span>
                  </td>

                  <td className="py-3 px-3 align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.stance_certainty === "Firm"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.stance_certainty === "Leaning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {r.stance_certainty}
                    </span>
                  </td>

                  <td className="py-3 px-3 align-top text-slate-700 font-medium leading-relaxed max-w-xs">
                    {r.key_reason}
                  </td>

                  <td className="py-3 px-3 align-top max-w-xs">
                    {r.quote_original && (
                      <div className="bg-slate-50 p-2 rounded-md border border-slate-200/60 space-y-1">
                        <p className="text-[11px] text-slate-800 italic flex items-start space-x-1">
                          <Quote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>&quot;{r.quote_original}&quot;</span>
                        </p>
                        {r.quote_english && (
                          <p className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-1">
                            {r.quote_english}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 align-top max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {r.key_issues && r.key_issues.length > 0 ? (
                        r.key_issues.map((issue, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          >
                            {issue}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                    <a
                      href={r.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span className="truncate max-w-[120px]">{r.video_title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
