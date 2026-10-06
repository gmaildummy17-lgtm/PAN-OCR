import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { recognize } from "tesseract.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support base64 image uploads up to 30MB
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY is not defined in environment variables.");
}

// Track models in temporary cooldown when they hit 429 rate limits
const modelCooldowns = new Map<string, number>();

function isModelInCooldown(modelName: string): boolean {
  const coolUntil = modelCooldowns.get(modelName);
  if (!coolUntil) return false;
  if (Date.now() > coolUntil) {
    modelCooldowns.delete(modelName);
    return false;
  }
  return true;
}

function setModelCooldown(modelName: string, durationMs: number = 60000) {
  modelCooldowns.set(modelName, Date.now() + durationMs);
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// PAN / ID Card OCR Extraction endpoint
app.post("/api/extract-id", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", fileName = "card-scan.jpg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data in request." });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/\+\-]+;base64,/, "");

    // If Gemini client is not initialized or API key is missing
    if (!ai) {
      if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } else {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.",
        });
      }
    }

    const systemInstruction = `You are a strict, high-precision OCR extractor for identity cards, specializing in Indian Permanent Account Number (PAN) cards and official identity documents.

Strict Extraction Rules:
- For PAN cards:
  * Extract PAN Number: Exactly 10 alphanumeric characters formatted as [A-Z]{5}[0-9]{4}[A-Z]{1} (e.g. ABCDE1234F). Always capitalize.
  * Extract Full Name: The exact name of the cardholder as printed on the card.
  * Extract Father's Name: The father's name as printed on the card.
  * Extract Date of Birth: STRICTLY format as DD/MM/YYYY (e.g. 15/08/1990). If day or month is single digit, pad with leading zero (e.g. 05/04/1988).
- If ANY detail (PAN Number, Full Name, Father's Name, or Date of Birth) is missing, unreadable, cut off, blurred, or not present, write strictly "N/A".
- Never output markdown, backticks, conversational preamble, or explanations outside the JSON response.
- For other ID cards (Aadhaar, Voter ID, Driving License, Passport):
  * Set cardType accurately.
  * Extract Full Name, Father's Name (or N/A), Date of Birth in DD/MM/YYYY (or N/A).
  * If it is not a PAN card, set panNumber to "N/A" and put the ID number in documentNumber.
- Return an estimated confidence score between 0 and 100 based on image legibility.`;

    const promptText = `Extract the identity card details strictly adhering to the specified schema and rules. Ensure PAN Number, Full Name, Father's Name, and Date of Birth (DD/MM/YYYY) are populated or "N/A".`;

    // Multi-Model Quota Fallback Chain with active model families
    const FALLBACK_MODELS = [
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.1-pro-preview",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let response = null;
    let lastError: any = null;
    let modelUsed = "";

    for (const modelName of FALLBACK_MODELS) {
      if (isModelInCooldown(modelName)) {
        console.log(`[OCR] Skipping ${modelName} (currently in rate-limit cooldown)`);
        continue;
      }

      try {
        console.log(`[OCR] Attempting extraction with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                cardType: {
                  type: Type.STRING,
                  description: "Card type e.g. 'PAN Card', 'Aadhaar Card', 'Driving License', 'Voter ID', 'Passport', 'Other ID'",
                },
                panNumber: {
                  type: Type.STRING,
                  description: "10-character PAN number (e.g. ABCDE1234F) or 'N/A'",
                },
                fullName: {
                  type: Type.STRING,
                  description: "Full Name on the card or 'N/A'",
                },
                fatherName: {
                  type: Type.STRING,
                  description: "Father's Name on the card or 'N/A'",
                },
                dob: {
                  type: Type.STRING,
                  description: "Date of Birth strictly in DD/MM/YYYY format or 'N/A'",
                },
                documentNumber: {
                  type: Type.STRING,
                  description: "Document/Certificate ID number if applicable, or 'N/A'",
                },
                confidence: {
                  type: Type.NUMBER,
                  description: "Confidence percentage (0 to 100)",
                },
                rawExtractedText: {
                  type: Type.STRING,
                  description: "Concise raw visible text detected on the card",
                },
                notes: {
                  type: Type.STRING,
                  description: "Short notes on legibility, missing items, or status",
                },
              },
              required: ["cardType", "panNumber", "fullName", "fatherName", "dob", "confidence"],
            },
          },
        });

        if (response) {
          modelUsed = modelName;
          console.log(`[OCR] Successfully extracted using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        const isQuotaErr =
          err?.status === 429 ||
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isQuotaErr) {
          setModelCooldown(modelName, 60000); // Put rate-limited model on 60s cooldown
        }
        console.log(`[OCR] Model ${modelName} unavailable/rate-limited. Switching to next fallback model...`);
      }
    }

    // Local zero-quota fallback using Tesseract.js
async function processWithTesseract(cleanBase64: string, fileName: string) {
  try {
    console.log("[OCR] Running local Tesseract.js engine fallback...");
    const imgBuffer = Buffer.from(cleanBase64, "base64");
    const { data } = await recognize(imgBuffer, "eng");
    const rawText = data.text || "";

    const panMatch = rawText.match(/([A-Z]{5}[0-9]{4}[A-Z])/i);
    const panNumber = panMatch ? panMatch[1].toUpperCase() : "N/A";
    const isValidPanFormat = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber);

    const dobMatch = rawText.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/);
    const dob = dobMatch ? dobMatch[1].replace(/[\-\.]/g, "/") : "N/A";

    const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
    let fullName = "N/A";
    let fatherName = "N/A";

    for (let i = 0; i < lines.length; i++) {
      if (/NAME/i.test(lines[i]) && !/FATHER/i.test(lines[i])) {
        if (lines[i + 1] && !/FATHER|INCOME|GOVT|INDIA|DATE|DOB/i.test(lines[i + 1])) {
          fullName = lines[i + 1];
        }
      }
      if (/FATHER/i.test(lines[i])) {
        if (lines[i + 1] && !/INCOME|GOVT|INDIA|DATE|DOB/i.test(lines[i + 1])) {
          fatherName = lines[i + 1];
        }
      }
    }

    return {
      cardType: panMatch ? "PAN Card" : "Identity Card",
      panNumber,
      isValidPanFormat,
      fullName,
      fatherName,
      dob,
      documentNumber: "N/A",
      confidence: Math.round(data.confidence || 75),
      rawExtractedText: rawText.substring(0, 300) || "Tesseract raw text captured",
      notes: "Extracted via Tesseract.js engine (Zero-Quota Local Fallback).",
      fileName,
      extractedAt: new Date().toISOString(),
      modelUsed: "tesseract.js",
    };
  } catch (err) {
    console.error("[OCR] Tesseract.js fallback error:", err);
    return null;
  }
}

// Graceful Fallback if all AI model quotas are exhausted
    if (!response) {
      console.warn("[OCR] All AI models in fallback chain exhausted quota or failed. Attempting Tesseract.js local OCR...");
      const tesseractResult = await processWithTesseract(cleanBase64, fileName);
      if (tesseractResult) {
        return res.json(tesseractResult);
      }

      return res.json({
        cardType: "PAN Card",
        panNumber: "N/A",
        isValidPanFormat: false,
        fullName: "N/A",
        fatherName: "N/A",
        dob: "N/A",
        documentNumber: "N/A",
        confidence: 0,
        rawExtractedText: "[Gemini & Tesseract API quota reached. Please double click cells below to fill manually]",
        notes: "API Quota Limit reached (429). Row added with N/A fields — please double-click to edit directly.",
        fileName,
        extractedAt: new Date().toISOString(),
        modelUsed: "manual-fallback",
        isQuotaFallback: true,
      });
    }

    const responseText = response.text?.trim() || "{}";
    let extractedData;
    try {
      extractedData = JSON.parse(responseText);
    } catch {
      // Fallback cleanup if any markdown ticks snuck in
      const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
      extractedData = JSON.parse(cleaned);
    }

    // Standardize fields to strict uppercase or "N/A"
    const panClean = (extractedData.panNumber || "N/A").trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const isValidPan = panRegex.test(panClean);

    // Ensure strictly "N/A" if empty or null or undefined
    const sanitizeField = (val: unknown): string => {
      if (!val || typeof val !== "string") return "N/A";
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "none") {
        return "N/A";
      }
      return trimmed;
    };

    const finalResult = {
      cardType: sanitizeField(extractedData.cardType) || "PAN Card",
      panNumber: sanitizeField(panClean),
      isValidPanFormat: isValidPan,
      fullName: sanitizeField(extractedData.fullName),
      fatherName: sanitizeField(extractedData.fatherName),
      dob: sanitizeField(extractedData.dob),
      documentNumber: sanitizeField(extractedData.documentNumber),
      confidence: typeof extractedData.confidence === "number" ? Math.round(extractedData.confidence) : 95,
      rawExtractedText: extractedData.rawExtractedText || "",
      notes: extractedData.notes || (isValidPan ? "Valid PAN card extracted successfully." : "Extraction completed."),
      fileName,
      extractedAt: new Date().toISOString(),
      modelUsed,
    };

    return res.json(finalResult);
  } catch (error: any) {
    console.error("OCR Extraction Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process card OCR extraction.",
      details: error?.stack,
    });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
