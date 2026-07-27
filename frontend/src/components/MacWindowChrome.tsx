"use client";

import React from "react";
import { Download, RefreshCw, Sparkles } from "lucide-react";

interface MacWindowChromeProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  isRefreshing?: boolean;
  children?: React.ReactNode;
}

export const MacWindowChrome: React.FC<MacWindowChromeProps> = ({
  title,
  subtitle,
  onRefresh,
  onExport,
  isRefreshing = false,
  children,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[90vh]">
      {/* Top Header Bar */}
      <header className="mac-glass flex items-center justify-between px-4 py-3 border-b border-slate-200/80 shadow-xs">
        {/* Left: macOS Traffic Lights & Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:opacity-80 transition-opacity border border-red-600/30 cursor-pointer" title="Close" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 transition-opacity border border-yellow-600/30 cursor-pointer" title="Minimize" />
            <div className="w-3 h-3 rounded-full bg-green-500 hover:opacity-80 transition-opacity border border-green-600/30 cursor-pointer" title="Maximize" />
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <div>
              <h1 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">{title}</h1>
              {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              <span>Refresh</span>
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};
