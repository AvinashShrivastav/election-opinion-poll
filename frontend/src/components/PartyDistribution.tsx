"use client";

import React from "react";
import { Vote } from "lucide-react";

interface PartyDistributionProps {
  partyCounts: Record<string, number>;
  totalRespondents: number;
}

const PARTY_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  BJP: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", fill: "bg-orange-500" },
  "Jan Suraaj": { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", fill: "bg-amber-500" },
  RJD: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", fill: "bg-emerald-600" },
  JDU: { bg: "bg-green-50 border-green-200", text: "text-green-800", fill: "bg-green-600" },
  Congress: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", fill: "bg-sky-500" },
  "NDA (Alliance)": { bg: "bg-orange-50 border-orange-200", text: "text-orange-800", fill: "bg-orange-600" },
  "Mahagathbandhan (Alliance)": { bg: "bg-teal-50 border-teal-200", text: "text-teal-800", fill: "bg-teal-600" },
  "Undecided / Neutral": { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", fill: "bg-slate-400" },
  Others: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", fill: "bg-purple-500" },
};

export const PartyDistribution: React.FC<PartyDistributionProps> = ({
  partyCounts,
  totalRespondents,
}) => {
  const sortedParties = Object.entries(partyCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mac-card p-5 border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <Vote className="w-4 h-4 text-blue-600" />
            <span>Political Party Preference Share</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Distribution based on {totalRespondents} interviewed voters</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {sortedParties.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No party distribution data yet.</p>
        ) : (
          sortedParties.map(([party, count]) => {
            const pct = totalRespondents > 0 ? Math.round((count / totalRespondents) * 100) : 0;
            const colors = PARTY_COLORS[party] || { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", fill: "bg-slate-500" };

            return (
              <div key={party} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${colors.bg} ${colors.text}`}>
                    {party}
                  </span>
                  <span className="font-medium text-slate-600">
                    <strong className="text-slate-900 font-bold">{count}</strong> voters ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.fill}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
