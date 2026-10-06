import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Database,
  Code2,
  RefreshCw,
  Info,
} from "lucide-react";
import { IdentityCardRecord } from "../types";
import {
  generateStructuredCsv,
  generateStrictPanCsv,
  generateSqlScript,
  downloadFile,
  parseCsvToRecords,
} from "../utils/csv";

interface LiveCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: IdentityCardRecord[];
  onImportCsv?: (importedRecords: Partial<IdentityCardRecord>[]) => void;
  initialTab?: "csv" | "sql" | "json";
}

export const LiveCsvModal: React.FC<LiveCsvModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportCsv,
  initialTab = "csv",
}) => {
  const [activeTab, setActiveTab] = useState<"csv" | "sql" | "json">(initialTab);
  const [formatMode, setFormatMode] = useState<"strict" | "full">("strict");
  const [sqlDialect, setSqlDialect] = useState<"postgres" | "mysql">("postgres");
  const [copied, setCopied] = useState(false);
  const [editableCsv, setEditableCsv] = useState<string>("");
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  if (!isOpen) return null;

  const strictCsv = generateStrictPanCsv(records);
  const fullCsv = generateStructuredCsv(records);
  const activeCsv = isEditingRaw ? editableCsv : formatMode === "strict" ? strictCsv : fullCsv;

  const sqlScript = generateSqlScript(records, sqlDialect);
  const jsonExport = JSON.stringify(
    records.map((r) => ({
      panNumber: r.panNumber,
      fullName: r.fullName,
      fatherName: r.fatherName,
      dob: r.dob,
      cardType: r.cardType,
      documentNumber: r.documentNumber,
      confidence: r.confidence,
      status: r.status,
      fileName: r.fileName,
      extractedAt: r.createdAt,
    })),
    null,
    2
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeTab === "csv") {
      downloadFile(
        activeCsv,
        formatMode === "strict" ? "pan_card_ocr_strict.csv" : "identity_cards_full.csv",
        "text/csv;charset=utf-8;"
      );
    } else if (activeTab === "sql") {
      downloadFile(sqlScript, `identity_cards_${sqlDialect}.sql`, "text/plain;charset=utf-8;");
    } else {
      downloadFile(jsonExport, "identity_cards_export.json", "application/json;charset=utf-8;");
    }
  };

  const handleApplyCsvEdits = () => {
    if (onImportCsv && editableCsv) {
      const parsed = parseCsvToRecords(editableCsv);
      if (parsed.length > 0) {
        onImportCsv(parsed);
        setIsEditingRaw(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Structured Output & Database Integration
              </h2>
              <p className="text-xs text-slate-400">
                Synchronized live CSV view, SQL schema, and bulk insert statements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection & Sub-toolbar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTab("csv");
                setIsEditingRaw(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === "csv"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Live CSV</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("sql");
                setIsEditingRaw(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === "sql"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>SQL Database</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("json");
                setIsEditingRaw(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === "json"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>JSON Export</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 text-xs">
            {activeTab === "csv" && (
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => {
                    setFormatMode("strict");
                    setIsEditingRaw(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    formatMode === "strict" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Strict 4 columns: PAN Number, Full Name, Father's Name, Date of Birth"
                >
                  Strict 4-Column PAN
                </button>
                <button
                  onClick={() => {
                    setFormatMode("full");
                    setIsEditingRaw(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    formatMode === "full" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Full schema with Document ID, Confidence, Status"
                >
                  Full Columns
                </button>
              </div>
            )}

            {activeTab === "sql" && (
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setSqlDialect("postgres")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    sqlDialect === "postgres" ? "bg-slate-800 text-purple-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  PostgreSQL
                </button>
                <button
                  onClick={() => setSqlDialect("mysql")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    sqlDialect === "mysql" ? "bg-slate-800 text-purple-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  MySQL
                </button>
              </div>
            )}

            <button
              onClick={() => handleCopy(activeTab === "csv" ? activeCsv : activeTab === "sql" ? sqlScript : jsonExport)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition shadow-md shadow-cyan-900/30"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300">
          {activeTab === "csv" && (
            <div className="h-full flex flex-col">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  RFC 4180 Compliant CSV • {records.length} records • Strict "N/A" for missing values
                </span>
                <span className="text-emerald-400">Live Synchronized</span>
              </div>
              <textarea
                value={activeCsv}
                onChange={(e) => {
                  setEditableCsv(e.target.value);
                  setIsEditingRaw(true);
                }}
                className="w-full flex-1 min-h-[300px] bg-slate-900/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                spellCheck={false}
              />
              {isEditingRaw && (
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="text-amber-400 text-xs">You have unsaved manual edits.</span>
                  <button
                    onClick={handleApplyCsvEdits}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-sans font-medium"
                  >
                    Sync Edits to Spreadsheet
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "sql" && (
            <div className="h-full flex flex-col">
              <div className="mb-2 text-[11px] text-slate-500">
                DDL Table Definition & Prepared Bulk Insert Statements ready for {sqlDialect === "postgres" ? "PostgreSQL / Supabase" : "MySQL"}
              </div>
              <textarea
                value={sqlScript}
                readOnly
                className="w-full flex-1 min-h-[300px] bg-slate-900/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-purple-200 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {activeTab === "json" && (
            <div className="h-full flex flex-col">
              <div className="mb-2 text-[11px] text-slate-500">
                JSON Document format for API pipelines, MongoDB, or indexing
              </div>
              <textarea
                value={jsonExport}
                readOnly
                className="w-full flex-1 min-h-[300px] bg-slate-900/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              All extracted rows strictly adhere to: PAN Number, Full Name, Father's Name, Date of Birth (DD/MM/YYYY).
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-sans font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
