import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Eye,
  Trash2,
  Copy,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Edit2,
} from "lucide-react";
import { IdentityCardRecord, SpreadsheetColumnKey } from "../types";
import { isValidPanFormat, isValidDobFormat } from "../utils/csv";

interface SpreadsheetViewProps {
  records: IdentityCardRecord[];
  onUpdateRecord: (id: string, updates: Partial<IdentityCardRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onDuplicateRecord: (id: string) => void;
  onInspectRecord: (record: IdentityCardRecord) => void;
  onLoadSamples: () => void;
  onOpenUpload: () => void;
}

interface ActiveCell {
  rowId: string;
  rowIndex: number;
  colKey: SpreadsheetColumnKey;
  colLetter: string;
  value: string;
}

const COLUMNS: {
  key: SpreadsheetColumnKey;
  letter: string;
  label: string;
  width: string;
  ruleHint: string;
}[] = [
  { key: "panNumber", letter: "A", label: "PAN Number", width: "w-44", ruleHint: "Format: [A-Z]{5}[0-9]{4}[A-Z] or 'N/A'" },
  { key: "fullName", letter: "B", label: "Full Name", width: "w-56", ruleHint: "Full Name of Cardholder or 'N/A'" },
  { key: "fatherName", letter: "C", label: "Father's Name", width: "w-52", ruleHint: "Father's Name or 'N/A'" },
  { key: "dob", letter: "D", label: "Date of Birth", width: "w-40", ruleHint: "Strictly DD/MM/YYYY or 'N/A'" },
  { key: "cardType", letter: "E", label: "Card Type", width: "w-36", ruleHint: "Identity Card Type" },
  { key: "documentNumber", letter: "F", label: "Document ID", width: "w-40", ruleHint: "Secondary Doc ID or 'N/A'" },
  { key: "status", letter: "G", label: "Status", width: "w-32", ruleHint: "Verification Status" },
  { key: "confidence", letter: "H", label: "Confidence", width: "w-28", ruleHint: "Extraction Confidence %" },
];

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  records,
  onUpdateRecord,
  onDeleteRecord,
  onDuplicateRecord,
  onInspectRecord,
  onLoadSamples,
  onOpenUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid_pan" | "has_na" | "flagged">("all");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [editingCell, setEditingCell] = useState<ActiveCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SpreadsheetColumnKey; direction: "asc" | "desc" } | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Filter & Search Records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      searchTerm === "" ||
      r.panNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dob.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cardType.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "valid_pan") {
      return isValidPanFormat(r.panNumber);
    }
    if (statusFilter === "has_na") {
      return (
        r.panNumber === "N/A" ||
        r.fullName === "N/A" ||
        r.fatherName === "N/A" ||
        r.dob === "N/A"
      );
    }
    if (statusFilter === "flagged") {
      return r.status === "flagged" || !isValidPanFormat(r.panNumber) || !isValidDobFormat(r.dob);
    }

    return true;
  });

  // Sorting
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = String(a[key] || "");
    const valB = String(b[key] || "");
    const comparison = valA.localeCompare(valB, undefined, { numeric: true });
    return direction === "asc" ? comparison : -comparison;
  });

  const handleSort = (key: SpreadsheetColumnKey) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const handleCellClick = (record: IdentityCardRecord, rowIndex: number, col: typeof COLUMNS[0]) => {
    setActiveCell({
      rowId: record.id,
      rowIndex: rowIndex + 1,
      colKey: col.key,
      colLetter: col.letter,
      value: String(record[col.key] || ""),
    });
  };

  const handleCellDoubleClick = (record: IdentityCardRecord, rowIndex: number, col: typeof COLUMNS[0]) => {
    const val = String(record[col.key] || "");
    setEditingCell({
      rowId: record.id,
      rowIndex: rowIndex + 1,
      colKey: col.key,
      colLetter: col.letter,
      value: val,
    });
    setEditValue(val);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    let finalVal = editValue.trim();

    // If blank, revert to "N/A" per rules
    if (!finalVal) {
      finalVal = "N/A";
    }

    // Auto-uppercase PAN
    if (editingCell.colKey === "panNumber" && finalVal !== "N/A") {
      finalVal = finalVal.toUpperCase();
    }

    const updates: Partial<IdentityCardRecord> = {
      [editingCell.colKey]: finalVal,
      updatedAt: new Date().toISOString(),
    };

    // Auto-recalculate status if PAN or DOB is edited
    if (editingCell.colKey === "panNumber" || editingCell.colKey === "dob") {
      const current = records.find((r) => r.id === editingCell.rowId);
      if (current) {
        const panToCheck = editingCell.colKey === "panNumber" ? finalVal : current.panNumber;
        const dobToCheck = editingCell.colKey === "dob" ? finalVal : current.dob;
        if (isValidPanFormat(panToCheck) && isValidDobFormat(dobToCheck)) {
          updates.status = "verified";
        }
      }
    }

    onUpdateRecord(editingCell.rowId, updates);

    // Update active cell value
    if (activeCell && activeCell.rowId === editingCell.rowId && activeCell.colKey === editingCell.colKey) {
      setActiveCell({ ...activeCell, value: finalVal });
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === sortedRecords.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(sortedRecords.map((r) => r.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  const handleDeleteSelected = () => {
    selectedRowIds.forEach((id) => onDeleteRecord(id));
    setSelectedRowIds(new Set());
  };

  // Render cell content with smart validation badges and "N/A" styling
  const renderCellContent = (record: IdentityCardRecord, colKey: SpreadsheetColumnKey) => {
    const value = String(record[colKey] || "");

    if (value === "N/A") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          N/A
        </span>
      );
    }

    if (colKey === "panNumber") {
      const valid = isValidPanFormat(value);
      return (
        <div className="flex items-center justify-between gap-1.5 w-full">
          <span className="font-mono font-semibold tracking-wider text-slate-100">{value}</span>
          {valid ? (
            <span title="Valid PAN Structure (5 letters, 4 digits, 1 letter)" className="text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 inline" />
            </span>
          ) : (
            <span title="Invalid PAN Format" className="text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5 inline" />
            </span>
          )}
        </div>
      );
    }

    if (colKey === "dob") {
      const valid = isValidDobFormat(value);
      return (
        <div className="flex items-center justify-between gap-1.5 w-full">
          <span className="font-mono text-slate-200">{value}</span>
          {!valid && value !== "N/A" && (
            <span title="Date should be DD/MM/YYYY" className="text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 inline" />
            </span>
          )}
        </div>
      );
    }

    if (colKey === "status") {
      const isVerified = record.status === "verified";
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isVerified
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isVerified ? "bg-emerald-400" : "bg-amber-400"}`} />
          {record.status}
        </span>
      );
    }

    if (colKey === "confidence") {
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-10 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                record.confidence > 90 ? "bg-emerald-400" : record.confidence > 75 ? "bg-cyan-400" : "bg-amber-400"
              }`}
              style={{ width: `${record.confidence}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400">{record.confidence}%</span>
        </div>
      );
    }

    return <span className="text-slate-200 truncate">{value}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Spreadsheet Toolbar & Filter Controls */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filter pills */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PAN, Name, DOB, or Card Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-cyan-500 focus:outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === "all" ? "bg-cyan-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter("valid_pan")}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === "valid_pan"
                  ? "bg-emerald-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Valid PAN
            </button>
            <button
              onClick={() => setStatusFilter("has_na")}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === "has_na"
                  ? "bg-amber-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Has "N/A"
            </button>
          </div>
        </div>

        {/* Selected Batch Actions */}
        {selectedRowIds.size > 0 && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">{selectedRowIds.size} selected</span>
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-950/40 transition"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Spreadsheet Formula Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex items-center gap-2 text-xs">
        {/* Cell Coordinate Box */}
        <div className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono font-bold text-cyan-400 min-w-[54px] text-center shadow-inner">
          {activeCell ? `${activeCell.colLetter}${activeCell.rowIndex}` : "A1"}
        </div>

        {/* Function / Equal symbol */}
        <span className="text-slate-500 font-serif italic font-bold">fx</span>

        {/* Formula / Cell Content Bar */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-0.5 font-mono text-slate-200 truncate flex items-center justify-between">
          <span>{activeCell ? activeCell.value : "Select any cell to view or double click to edit"}</span>
          {activeCell && (
            <span className="text-[10px] text-slate-500 font-sans">
              Double click cell or press Enter to edit
            </span>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-auto bg-slate-950 custom-scrollbar">
        {sortedRecords.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center mb-4 text-cyan-400">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Spreadsheet is currently empty</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              Start by uploading PAN or identity cards, or immediately test the OCR extraction rules with pre-configured sample cards.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onLoadSamples}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-900/30"
              >
                <Sparkles className="h-4 w-4" /> Load Test Sample Cards
              </button>
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Upload ID Images
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            {/* Header Row */}
            <thead className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-slate-400 select-none shadow-sm">
              <tr>
                {/* Checkbox column */}
                <th className="w-10 px-2 py-2.5 text-center border-r border-slate-800/80 bg-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.size === sortedRecords.length && sortedRecords.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-800 cursor-pointer"
                  />
                </th>

                {/* Row Number Column Header */}
                <th className="w-12 px-2 py-2.5 text-center font-mono text-[11px] border-r border-slate-800 bg-slate-900 text-slate-500">
                  #
                </th>

                {/* Column Headers with Letters & Sort */}
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`${col.width} px-3 py-2 border-r border-slate-800 hover:bg-slate-850 cursor-pointer transition`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold">{col.letter}</span>
                        <span className="font-semibold text-slate-200 tracking-tight">{col.label}</span>
                      </div>
                      <ArrowUpDown className="h-3 w-3 text-slate-500 hover:text-cyan-400" />
                    </div>
                  </th>
                ))}

                {/* Actions Header */}
                <th className="w-24 px-3 py-2 text-center border-r border-slate-800 text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sortedRecords.map((record, rowIndex) => {
                const isSelected = selectedRowIds.has(record.id);

                return (
                  <tr
                    key={record.id}
                    className={`group transition-colors ${
                      isSelected
                        ? "bg-cyan-950/20 hover:bg-cyan-950/30"
                        : rowIndex % 2 === 0
                        ? "bg-slate-950 hover:bg-slate-900/60"
                        : "bg-slate-900/30 hover:bg-slate-900/70"
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="px-2 py-2 text-center border-r border-slate-800/60">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(record.id)}
                        className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-800 cursor-pointer"
                      />
                    </td>

                    {/* Row Number */}
                    <td className="px-2 py-2 text-center font-mono text-[11px] text-slate-500 border-r border-slate-800/60 bg-slate-900/20 select-none">
                      {rowIndex + 1}
                    </td>

                    {/* Columns A - H */}
                    {COLUMNS.map((col) => {
                      const isCellActive =
                        activeCell?.rowId === record.id && activeCell?.colKey === col.key;
                      const isCellEditing =
                        editingCell?.rowId === record.id && editingCell?.colKey === col.key;

                      return (
                        <td
                          key={col.key}
                          onClick={() => handleCellClick(record, rowIndex, col)}
                          onDoubleClick={() => handleCellDoubleClick(record, rowIndex, col)}
                          className={`px-3 py-2 border-r border-slate-800/60 relative cursor-pointer ${
                            isCellActive ? "ring-2 ring-cyan-500 ring-inset bg-cyan-950/30" : ""
                          }`}
                        >
                          {isCellEditing ? (
                            <div className="flex items-center gap-1 w-full">
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleSaveEdit}
                                className="w-full bg-slate-900 text-xs text-white px-2 py-1 rounded border border-cyan-400 focus:outline-none font-mono"
                              />
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            renderCellContent(record, col.key)
                          )}
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    <td className="px-2 py-2 text-center border-r border-slate-800/60">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onInspectRecord(record)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                          title="Inspect card scan & extracted lines"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateRecord(record.id)}
                          className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-slate-800"
                          title="Duplicate record"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Spreadsheet Status Footer */}
      <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span>
            Showing <strong className="text-slate-200">{sortedRecords.length}</strong> of{" "}
            <strong className="text-slate-200">{records.length}</strong> rows
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            Rules: PAN: <code className="text-cyan-400 font-mono">[A-Z]5[0-9]4[A-Z]1</code> • DOB: <code className="text-cyan-400 font-mono">DD/MM/YYYY</code> • Missing: <code className="text-amber-400 font-mono">"N/A"</code>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Edit2 className="h-3 w-3 text-cyan-400" /> Double-click any cell to edit live
          </span>
        </div>
      </div>
    </div>
  );
};
