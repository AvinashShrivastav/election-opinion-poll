"use client";

import React from "react";
import { LayoutDashboard, Users, Video, PlusCircle, Globe, FileSpreadsheet, Activity } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalRespondents?: number;
  totalVideos?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  totalRespondents = 0,
  totalVideos = 0,
}) => {
  const navItems = [
    { id: "livetracker", label: "🔴 Live Pipeline Tracker", icon: Activity, badge: "207" },
    { id: "overview", label: "Executive Dashboard", icon: LayoutDashboard },
    { id: "videos", label: "Video Story Arc", icon: Video, badge: totalVideos },
    { id: "voters", label: "Voter Data Grid", icon: Users, badge: totalRespondents },
    { id: "pipeline", label: "Add YouTube URLs", icon: PlusCircle },
  ];

  return (
    <aside className="w-full md:w-64 mac-glass border-r border-slate-200/80 flex flex-col justify-between p-4 select-none shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Election Media Intelligence
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick System Info */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center space-x-2 text-slate-800">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold">AI Field Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Verbatim sentiment extraction from Bihar ground report transcripts & multimodal audio.
          </p>
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FastAPI Live</span>
        </span>
        <span className="font-bold text-slate-700">v2.0</span>
      </div>
    </aside>
  );
};
