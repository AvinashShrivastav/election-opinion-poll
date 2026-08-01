"use client";

import React, { useState } from "react";
import { PlusCircle, Loader2, PlaySquare, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface UrlPipelineFormProps {
  onSuccess?: () => void;
}

export const UrlPipelineForm: React.FC<UrlPipelineFormProps> = ({ onSuccess }) => {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setStatusMsg({ type: "error", text: "Please enter at least one valid YouTube video or playlist URL." });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: "info", text: `Extracting transcripts & opinions via AI Pipeline for ${urls.length} video(s)...` });

    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "API extraction failed.");
      }

      setUrlInput("");
      setStatusMsg({ type: "success", text: "Extraction completed successfully! Data updated in dashboard below." });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Extraction failed. Ensure backend API is running." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mac-card p-6 border border-slate-200/80 bg-white rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
          <PlaySquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-1.5">
            <span>Add YouTube Ground Reports / Playlists to Pipeline</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          </h2>
          <p className="text-xs text-slate-500">Paste YouTube watch URLs or playlist links (one per line)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={4}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/playlist?list=..."
          disabled={isLoading}
          className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800 transition-all resize-none"
        />

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 border ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                : statusMsg.type === "error"
                ? "bg-red-50 text-red-800 border-red-200 font-semibold"
                : "bg-blue-50 text-blue-800 border-blue-200 font-semibold"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMsg.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Opinion Data...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Start Opinion Extraction</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* User Added Videos History Log */}
      <UserAddedVideosLog />
    </div>
  );
};

const UserAddedVideosLog = () => {
  const [userVideos, setUserVideos] = useState<any[]>([]);

  const fetchUserVideos = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/user-added-videos");
      if (res.ok) {
        const data = await res.json();
        setUserVideos(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchUserVideos();
    const interval = setInterval(fetchUserVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  if (userVideos.length === 0) return null;

  return (
    <div className="pt-4 border-t border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <span>📂 Extension & Manual Added Videos Log ({userVideos.length})</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">user_added_extension_videos.json</span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {userVideos.map((item: any, idx: number) => (
          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5 max-w-md truncate">
              <p className="font-bold text-slate-900 truncate">{item.title || item.url}</p>
              <p className="text-[10px] text-slate-500 font-mono">{item.added_at} • {item.source}</p>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-[11px] font-bold shrink-0 ml-2"
            >
              Open YouTube ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
