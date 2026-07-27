"use client";

import React from "react";
import { Video, Users, Award, MessageSquareQuote } from "lucide-react";

interface MetricsCardsProps {
  totalVideos: number;
  totalRespondents: number;
  partyCounts: Record<string, number>;
  issueCounts: Record<string, number>;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  totalVideos,
  totalRespondents,
  partyCounts,
  issueCounts,
}) => {
  // Determine top party
  const topPartyEntry = Object.entries(partyCounts).sort((a, b) => b[1] - a[1])[0];
  const topParty = topPartyEntry ? topPartyEntry[0] : "None";
  const topPartyCount = topPartyEntry ? topPartyEntry[1] : 0;
  const topPartyPct = totalRespondents > 0 ? Math.round((topPartyCount / totalRespondents) * 100) : 0;

  // Determine top issue
  const topIssueEntry = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0];
  const topIssue = topIssueEntry ? topIssueEntry[0] : "None";
  const topIssueCount = topIssueEntry ? topIssueEntry[1] : 0;

  const cards = [
    {
      title: "Videos Analyzed",
      value: totalVideos,
      subtext: "Ground report source videos",
      icon: Video,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Voters Interviewed",
      value: totalRespondents,
      subtext: "Extracted public respondents",
      icon: Users,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Leading Stance",
      value: topParty,
      subtext: `${topPartyCount} voters (${topPartyPct}% share)`,
      icon: Award,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      title: "Top Voter Issue",
      value: topIssue,
      subtext: `Mentioned ${topIssueCount} times`,
      icon: MessageSquareQuote,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="mac-card mac-card-hover p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
