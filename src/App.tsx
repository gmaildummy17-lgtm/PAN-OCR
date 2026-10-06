import React, { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { SpreadsheetView } from "./components/SpreadsheetView";
import { InlineImageAdder } from "./components/InlineImageAdder";
import { LiveCsvModal } from "./components/LiveCsvModal";
import { CardInspectorDrawer } from "./components/CardInspectorDrawer";
import { IdentityCardRecord, ExtractionStats } from "./types";
import { SAMPLE_CARDS } from "./data/sampleCards";
import { isValidPanFormat, generateStructuredCsv, downloadFile } from "./utils/csv";

export default function App() {
  // Pre-seed with the realistic sample cards to showcase instant live spreadsheet
  const [records, setRecords] = useState<IdentityCardRecord[]>(() => {
    return SAMPLE_CARDS.map((sample, index) => ({
      id: `sample-${index + 1}-${sample.presetExtraction.panNumber}`,
      panNumber: sample.presetExtraction.panNumber,
      fullName: sample.presetExtraction.fullName,
      fatherName: sample.presetExtraction.fatherName,
      dob: sample.presetExtraction.dob,
      cardType: sample.presetExtraction.cardType,
      documentNumber: sample.presetExtraction.documentNumber,
      confidence: sample.presetExtraction.confidence,
      status: sample.presetExtraction.status,
      fileName: sample.presetExtraction.fileName,
      fileThumbnail: sample.svgImage,
      rawExtractedText: sample.presetExtraction.rawExtractedText,
      notes: sample.presetExtraction.notes,
      createdAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  // Modal & Drawer States
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvModalInitialTab, setCsvModalInitialTab] = useState<"csv" | "sql" | "json">("csv");
  const [inspectedRecord, setInspectedRecord] = useState<IdentityCardRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Computed Statistics for the live header ribbon
  const stats: ExtractionStats = useMemo(() => {
    const total = records.length;
    let validPanCount = 0;
    let hasNaFieldsCount = 0;
    let totalConfidence = 0;

    records.forEach((r) => {
      if (isValidPanFormat(r.panNumber)) {
        validPanCount++;
      }
      if (
        r.panNumber === "N/A" ||
        r.fullName === "N/A" ||
        r.fatherName === "N/A" ||
        r.dob === "N/A"
      ) {
        hasNaFieldsCount++;
      }
      totalConfidence += r.confidence || 0;
    });

    return {
      total,
      panCount: records.filter((r) => r.cardType === "PAN Card").length,
      validPanCount,
      hasNaFieldsCount,
      avgConfidence: total > 0 ? Math.round(totalConfidence / total) : 0,
    };
  }, [records]);

  // Record Actions
  const handleUpdateRecord = (id: string, updates: Partial<IdentityCardRecord>) => {
    setRecords((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    // Keep inspected record in sync if open
    if (inspectedRecord && inspectedRecord.id === id) {
      setInspectedRecord((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
    if (inspectedRecord?.id === id) {
      setInspectedRecord(null);
    }
  };

  const handleDuplicateRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    const duplicated: IdentityCardRecord = {
      ...target,
      id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords((prev) => [duplicated, ...prev]);
  };

  const handleAddNewRow = () => {
    const newRecord: IdentityCardRecord = {
      id: `manual-${Date.now()}`,
      panNumber: "ABCDE1234F",
      fullName: "NEW CARDHOLDER",
      fatherName: "N/A",
      dob: "01/01/1990",
      cardType: "PAN Card",
      documentNumber: "N/A",
      confidence: 100,
      status: "verified",
      fileName: "manual_entry.csv",
      notes: "Manually inserted row in spreadsheet",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all rows from the spreadsheet?")) {
      setRecords([]);
      setInspectedRecord(null);
    }
  };

  const handleLoadSamples = () => {
    const sampleRecords: IdentityCardRecord[] = SAMPLE_CARDS.map((sample, index) => ({
      id: `sample-${Date.now()}-${index + 1}`,
      panNumber: sample.presetExtraction.panNumber,
      fullName: sample.presetExtraction.fullName,
      fatherName: sample.presetExtraction.fatherName,
      dob: sample.presetExtraction.dob,
      cardType: sample.presetExtraction.cardType,
      documentNumber: sample.presetExtraction.documentNumber,
      confidence: sample.presetExtraction.confidence,
      status: sample.presetExtraction.status,
      fileName: sample.presetExtraction.fileName,
      fileThumbnail: sample.svgImage,
      rawExtractedText: sample.presetExtraction.rawExtractedText,
      notes: sample.presetExtraction.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setRecords((prev) => [...sampleRecords, ...prev]);
  };

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_CARDS.find((s) => s.id === sampleId);
    if (!found) return;
    const newRecord: IdentityCardRecord = {
      id: `sample-${Date.now()}`,
      panNumber: found.presetExtraction.panNumber,
      fullName: found.presetExtraction.fullName,
      fatherName: found.presetExtraction.fatherName,
      dob: found.presetExtraction.dob,
      cardType: found.presetExtraction.cardType,
      documentNumber: found.presetExtraction.documentNumber,
      confidence: found.presetExtraction.confidence,
      status: found.presetExtraction.status,
      fileName: found.presetExtraction.fileName,
      fileThumbnail: found.svgImage,
      rawExtractedText: found.presetExtraction.rawExtractedText,
      notes: found.presetExtraction.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateStructuredCsv(records);
    downloadFile(csvContent, "pan_identity_cards_extracted.csv", "text/csv;charset=utf-8;");
  };

  const handleImportCsv = (importedRecords: Partial<IdentityCardRecord>[]) => {
    const completeRecords: IdentityCardRecord[] = importedRecords.map((r, i) => ({
      id: r.id || `csv-import-${Date.now()}-${i}`,
      panNumber: r.panNumber || "N/A",
      fullName: r.fullName || "N/A",
      fatherName: r.fatherName || "N/A",
      dob: r.dob || "N/A",
      cardType: r.cardType || "PAN Card",
      documentNumber: r.documentNumber || "N/A",
      confidence: r.confidence || 90,
      status: r.status || "verified",
      fileName: r.fileName || "imported.csv",
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setRecords(completeRecords);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        stats={stats}
        onOpenUpload={() => {
          const el = document.getElementById("same-page-adder");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenLiveCamera={() => {
          const el = document.getElementById("same-page-adder");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenCsvView={() => {
          setCsvModalInitialTab("csv");
          setIsCsvModalOpen(true);
        }}
        onOpenSqlView={() => {
          setCsvModalInitialTab("sql");
          setIsCsvModalOpen(true);
        }}
        onLoadSamples={handleLoadSamples}
        onAddNewRow={handleAddNewRow}
        onClearAll={handleClearAll}
        onDownloadCsv={handleDownloadCsv}
        isProcessing={isProcessing}
      />

      {/* Main Workspace: Same-Page Image Adder & Live Spreadsheet View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
        {/* Same-Page Image & Camera Adder Bar */}
        <div id="same-page-adder">
          <InlineImageAdder
            onAddRecords={(newRecs) => setRecords((prev) => [...newRecs, ...prev])}
            onSelectSample={handleSelectSample}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>

        {/* Live Spreadsheet View */}
        <SpreadsheetView
          records={records}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          onDuplicateRecord={handleDuplicateRecord}
          onInspectRecord={(rec) => setInspectedRecord(rec)}
          onLoadSamples={handleLoadSamples}
          onOpenUpload={() => {
            const el = document.getElementById("same-page-adder");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </main>

      {/* Live CSV & Database Integration Modal */}
      <LiveCsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        records={records}
        onImportCsv={handleImportCsv}
        initialTab={csvModalInitialTab}
      />

      {/* Card Inspector Drawer */}
      <CardInspectorDrawer
        record={inspectedRecord}
        onClose={() => setInspectedRecord(null)}
        onUpdateRecord={handleUpdateRecord}
      />
    </div>
  );
}
