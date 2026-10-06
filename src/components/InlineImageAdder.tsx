import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  X,
  Plus,
  FileImage,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { IdentityCardRecord } from "../types";
import { SAMPLE_CARDS } from "../data/sampleCards";

interface InlineImageAdderProps {
  onAddRecords: (records: IdentityCardRecord[]) => void;
  onSelectSample: (sampleId: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const InlineImageAdder: React.FC<InlineImageAdderProps> = ({
  onAddRecords,
  onSelectSample,
  isProcessing,
  setIsProcessing,}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "samples">("upload");
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  // Process selected or dropped image files directly on same page
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.name.endsWith(".pdf")
    );
    if (fileArray.length === 0) return;

    setIsProcessing(true);
    setStatusMessage({ type: "info", text: `Extracting OCR for ${fileArray.length} card(s)...` });

    const newRecords: IdentityCardRecord[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const file of fileArray) {
      try {
        const previewUrl = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);

        const res = await fetch("/api/extract-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || "image/jpeg",
            fileName: file.name,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const record: IdentityCardRecord = {
          id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          panNumber: data.panNumber || "N/A",
          fullName: data.fullName || "N/A",
          fatherName: data.fatherName || "N/A",
          dob: data.dob || "N/A",
          cardType: data.cardType || "PAN Card",
          documentNumber: data.documentNumber || "N/A",
          confidence: data.confidence || (data.isQuotaFallback ? 0 : 95),
          status: data.isValidPanFormat ? "verified" : "flagged",
          fileName: file.name,
          fileThumbnail: previewUrl,
          rawExtractedText: data.rawExtractedText || "",
          notes: data.notes || (data.modelUsed ? `Model used: ${data.modelUsed}` : ""),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (data.isQuotaFallback) {
          setStatusMessage({
            type: "error",
            text: "Gemini API free-tier quota limit reached (429). Added card image with 'N/A' defaults — double-click cells below to edit manually!",
          });
        }

        newRecords.push(record);
        successCount++;
      } catch (err: any) {
        console.error("OCR Extraction failed for file:", file.name, err);
        failCount++;
      }
    }

    if (newRecords.length > 0) {
      onAddRecords(newRecords);
      setStatusMessage({
        type: "success",
        text: `Extracted ${successCount} card(s) into spreadsheet! ${
          failCount > 0 ? `(${failCount} failed)` : ""
        }`,
      });
    } else {
      setStatusMessage({
        type: "error",
        text: "Failed to extract identity details from uploaded image(s). Please try again.",
      });
    }

    setIsProcessing(false);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Camera Management right on the page
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError("Camera permission denied or device not found.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleProcessCapturedPhoto = async () => {
    if (!capturedPhoto) return;
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Processing captured camera image with Gemini OCR..." });

    try {
      const res = await fetch("/api/extract-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: capturedPhoto,
          mimeType: "image/jpeg",
          fileName: `camera_scan_${Date.now()}.jpg`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server status ${res.status}`);
      }

      const data = await res.json();
      const record: IdentityCardRecord = {
        id: `camera-${Date.now()}`,
        panNumber: data.panNumber || "N/A",
        fullName: data.fullName || "N/A",
        fatherName: data.fatherName || "N/A",
        dob: data.dob || "N/A",
        cardType: data.cardType || "PAN Card",
        documentNumber: data.documentNumber || "N/A",
        confidence: data.confidence || 95,
        status: data.isValidPanFormat ? "verified" : "flagged",
        fileName: `webcam_scan_${new Date().toISOString().slice(0, 10)}.jpg`,
        fileThumbnail: capturedPhoto,
        rawExtractedText: data.rawExtractedText || "",
        notes: data.notes || (data.modelUsed ? `Model used: ${data.modelUsed}` : "Webcam Capture"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onAddRecords([record]);
      setStatusMessage({ type: "success", text: "Extracted webcam card directly into spreadsheet!" });
      setCapturedPhoto(null);
    } catch (err: any) {
      console.error("Camera OCR Error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to process camera scan." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-4 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Header Bar of the Same-Page Image Adder */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Upload className="h-4 w-4 text-cyan-400" />
            ADD CARD OR POUR SOME WINE
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
            Multi-Model FLIRTING READY
          </span>
        </div>

        {/* Tab switcher right on top of spreadsheet */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab("upload");
              stopCamera();
            }}
            className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Direct Upload / Drop
          </button>

          <button
            onClick={() => {
              setActiveTab("camera");
              startCamera();
            }}
            className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
              activeTab === "camera"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> Live Camera
          </button>

          <button
            onClick={() => {
              setActiveTab("samples");
              stopCamera();
            }}
            className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
              activeTab === "samples"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Test Samples
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white transition ml-1"
            title={isExpanded ? "Collapse Panel" : "Expand Panel"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 bg-slate-900/60">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`mb-3 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80"
                  : statusMessage.type === "error"
                  ? "bg-rose-950/60 text-rose-300 border-rose-800/80"
                  : "bg-cyan-950/60 text-cyan-300 border-cyan-800/80"
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {statusMessage.type === "error" && <AlertTriangle className="h-4 w-4 text-rose-400" />}
                {statusMessage.type === "info" && <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: Direct File Drop Zone on Same Page */}
          {activeTab === "upload" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => e.target.files && processFiles(e.target.files)}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  dragActive
                    ? "border-cyan-400 bg-cyan-950/30"
                    : "border-slate-700/80 hover:border-cyan-500/70 bg-slate-950/40 hover:bg-slate-950/80"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 mb-2 shadow-sm">
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  {isProcessing
                    ? "Extracting OCR with automatic model fallback..."
                    : "Drop PAN or Identity Card image directly here on the page, or click to choose file"}
                </p>
                <p className="text-[11px] text-white font-bold mt-1">
                  SIR A REAL APPRECIATION IS THE 50% HIKE ON MY SALARY IF NEED WE CAN NEGOTIATE 10000 LESS OR MORE
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Live Camera Viewfinder directly on page */}
          {activeTab === "camera" && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3">
              {cameraError ? (
                <div className="text-center py-6 text-xs text-rose-400">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-rose-500" />
                  <p>{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : capturedPhoto ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={capturedPhoto}
                    alt="Captured Frame"
                    className="max-h-56 rounded-lg border border-slate-800 object-contain"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCapturedPhoto(null);
                        startCamera();
                      }}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Retake
                    </button>
                    <button
                      onClick={handleProcessCapturedPhoto}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Extract into Table
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <div className="relative w-full max-w-lg h-56 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/80 rounded-lg m-4 flex items-end justify-center pb-2">
                      <span className="text-[10px] font-mono text-cyan-300 font-bold bg-black/70 px-2 py-0.5 rounded">
                        Align card within frame
                      </span>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={capturePhoto}
                    className="mt-3 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/40"
                  >
                    <Camera className="h-4 w-4" /> Capture Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Instant Test Sample Cards */}
          {activeTab === "samples" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SAMPLE_CARDS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample.id);
                    setStatusMessage({
                      type: "success",
                      text: `Loaded test sample: ${sample.title}`,
                    });
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 text-left transition group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {sample.title}
                    </span>
                    <Plus className="h-3.5 w-3.5 text-cyan-400 opacity-80 group-hover:opacity-100" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {sample.description}
                  </p>
                  <span className="inline-block mt-1.5 text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {sample.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
