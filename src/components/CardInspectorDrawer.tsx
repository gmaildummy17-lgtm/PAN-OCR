import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Calendar,
  User,
  Hash,
  ExternalLink,
  Edit2,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";
import { IdentityCardRecord } from "../types";
import { isValidPanFormat, isValidDobFormat } from "../utils/csv";

interface CardInspectorDrawerProps {
  record: IdentityCardRecord | null;
  onClose: () => void;
  onUpdateRecord: (id: string, updates: Partial<IdentityCardRecord>) => void;
}

export const CardInspectorDrawer: React.FC<CardInspectorDrawerProps> = ({
  record,
  onClose,
  onUpdateRecord,
}) => {
  if (!record) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    panNumber: record.panNumber,
    fullName: record.fullName,
    fatherName: record.fatherName,
    dob: record.dob,
    cardType: record.cardType,
    documentNumber: record.documentNumber,
    notes: record.notes || "",
  });

  const validPan = isValidPanFormat(formData.panNumber);
  const validDob = isValidDobFormat(formData.dob);

  const handleSave = () => {
    let pan = formData.panNumber.trim() || "N/A";
    if (pan !== "N/A") pan = pan.toUpperCase();

    const updates: Partial<IdentityCardRecord> = {
      panNumber: pan,
      fullName: formData.fullName.trim() || "N/A",
      fatherName: formData.fatherName.trim() || "N/A",
      dob: formData.dob.trim() || "N/A",
      cardType: formData.cardType.trim() || "PAN Card",
      documentNumber: formData.documentNumber.trim() || "N/A",
      notes: formData.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (isValidPanFormat(pan) && isValidDobFormat(updates.dob!)) {
      updates.status = "verified";
    }

    onUpdateRecord(record.id, updates);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Card Inspection & OCR Audit</h2>
              <p className="text-xs text-slate-400">Record ID: {record.id.slice(0, 12)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Edit Fields</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Card Preview Thumbnail */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-inner">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 px-1 flex items-center justify-between">
              <span>Card Scan / Document Visual</span>
              <span className="font-mono text-cyan-400">{record.fileName || "scanned_doc.jpg"}</span>
            </div>
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center min-h-[200px]">
              {record.fileThumbnail ? (
                <img
                  src={record.fileThumbnail}
                  alt="Card Preview"
                  className="w-full max-h-[260px] object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                  No visual thumbnail stored for this manual entry
                </div>
              )}
            </div>
          </div>

          {/* Strict Rules Audit Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Specification Compliance Checklist
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Confidence: {record.confidence}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                {validPan ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : formData.panNumber === "N/A" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-[11px] text-slate-400">PAN Format</div>
                  <div className="font-mono font-bold text-white">
                    {validPan ? "Valid Format" : formData.panNumber === "N/A" ? "Marked N/A" : "Invalid Pattern"}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                {validDob ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-[11px] text-slate-400">DOB Format</div>
                  <div className="font-mono font-bold text-white">
                    {validDob ? "Strict DD/MM/YYYY" : formData.dob === "N/A" ? "Marked N/A" : "Non-compliant"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields / Table Cells */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Extracted Table Columns
            </h3>

            {/* Field: PAN Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Column A: PAN Number</span>
                <span className="text-[10px] text-cyan-400 font-mono">[A-Z]5[0-9]4[A-Z]1</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                  placeholder="e.g. ABCDE1234F or N/A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                />
              ) : (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-sm text-cyan-300 font-bold flex items-center justify-between">
                  <span>{formData.panNumber}</span>
                  {formData.panNumber === "N/A" && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      Missing Field
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Field: Full Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Column B: Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name on card or N/A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              ) : (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 font-medium">
                  {formData.fullName}
                </div>
              )}
            </div>

            {/* Field: Father's Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Column C: Father's Name</span>
                {formData.fatherName === "N/A" && (
                  <span className="text-[10px] text-amber-400">Strict Rule: Marked "N/A"</span>
                )}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Father's Name or N/A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              ) : (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200">
                  {formData.fatherName}
                </div>
              )}
            </div>

            {/* Field: Date of Birth */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Column D: Date of Birth</span>
                <span className="text-[10px] text-cyan-400 font-mono">DD/MM/YYYY</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  placeholder="DD/MM/YYYY or N/A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              ) : (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-slate-200 flex items-center justify-between">
                  <span>{formData.dob}</span>
                  {formData.dob === "N/A" && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      Missing Field
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Field: Card Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Column E: Card Type
              </label>
              {isEditing ? (
                <select
                  value={formData.cardType}
                  onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="PAN Card">PAN Card</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Other ID">Other ID</option>
                </select>
              ) : (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200">
                  {formData.cardType}
                </div>
              )}
            </div>

            {/* Field: Document Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Column F: Document ID / Secondary Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  placeholder="Document number or N/A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              ) : (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-slate-200">
                  {formData.documentNumber}
                </div>
              )}
            </div>
          </div>

          {/* Raw Extracted Lines from Gemini OCR */}
          {record.rawExtractedText && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                Raw Document Text Detected
              </h3>
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {record.rawExtractedText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Scanned {new Date(record.createdAt).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
