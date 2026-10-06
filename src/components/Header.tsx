import React from "react";
import {
  FileSpreadsheet,
  Upload,
  Camera,
  Download,
  Copy,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Database,
  Trash2,
} from "lucide-react";
import { ExtractionStats } from "../types";

interface HeaderProps {
  stats: ExtractionStats;
  onOpenUpload: () => void;
  onOpenLiveCamera: () => void;
  onOpenCsvView: () => void;
  onOpenSqlView: () => void;
  onLoadSamples: () => void;
  onAddNewRow: () => void;
  onClearAll: () => void;
  onDownloadCsv: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onOpenUpload,
  onOpenLiveCamera,
  onOpenCsvView,
  onOpenSqlView,
  onLoadSamples,
  onAddNewRow,
  onClearAll,
  onDownloadCsv,
  isProcessing,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-[40px] w-auto object-contain rounded-xl shadow-md ring-1 ring-cyan-400/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  ID & PAN EXTRACTOR
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  VOTE FOR MODI 
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  HOPELESS LOVER
                </span>
              </div>
              <p className="text-xs text-white mt-0.5">
                PEAK AURA-THIS ART IS SACRIFICE BY LORD JAY
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onLoadSamples}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:text-white disabled:opacity-50"
              title="Load realistic sample PAN cards testing full match & N/A rules"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>JJAYY.TV</span>
            </button>

            <button
              onClick={onOpenLiveCamera}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:text-white disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5 text-cyan-400" />
              <span>Camera Scan</span>
            </button>

            <button
              onClick={onOpenUpload}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition hover:shadow-cyan-500/25 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Cards</span>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={onOpenCsvView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 transition shadow-sm"
              title="View live structured CSV format"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
              <span>Live CSV</span>
            </button>

            <button
              onClick={onOpenSqlView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-800/60 transition shadow-sm"
              title="Generate Database SQL Schema and INSERT statements"
            >
              <Database className="h-3.5 w-3.5 text-purple-400" />
              <span>DONT TOUCH</span>
            </button>

            <button
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 transition shadow-sm"
              title="Download structured CSV file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Live Metric Ribbon */}
        <div className="mt-3 pt-2.5 border-t border-slate-900/80 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Total Cards:</span>
            <span className="font-mono font-semibold text-white">{stats.total}</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/60 border border-slate-800/80">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Valid PAN:</span>
            <span className="font-mono font-semibold text-emerald-400">{stats.validPanCount}</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/60 border border-slate-800/80">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">"N/A" Fields:</span>
            <span className="font-mono font-semibold text-amber-400">{stats.hasNaFieldsCount}</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Avg Confidence:</span>
            <span className="font-mono font-semibold text-cyan-300">
              {stats.total > 0 ? `${stats.avgConfidence}%` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 col-span-2 sm:col-span-1">
            <button
              onClick={onAddNewRow}
              className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
            >
              <Plus className="h-3 w-3" /> Add Row
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={onClearAll}
              disabled={stats.total === 0}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1 transition disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
