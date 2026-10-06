export interface IdentityCardRecord {
  id: string;
  panNumber: string; // e.g. "ABCDE1234F" or "N/A"
  fullName: string; // Cardholder name or "N/A"
  fatherName: string; // Father's name or "N/A"
  dob: string; // Strictly DD/MM/YYYY or "N/A"
  cardType: string; // "PAN Card", "Aadhaar Card", etc.
  documentNumber: string; // Any secondary document number or "N/A"
  confidence: number; // 0-100
  status: "verified" | "flagged" | "processing" | "error";
  fileName: string;
  fileThumbnail?: string;
  rawExtractedText?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SpreadsheetColumnKey = keyof Pick<
  IdentityCardRecord,
  "panNumber" | "fullName" | "fatherName" | "dob" | "cardType" | "documentNumber" | "confidence" | "status"
>;

export interface ColumnDefinition {
  key: SpreadsheetColumnKey;
  label: string;
  colLetter: string;
  width: string;
  align?: "left" | "center" | "right";
  description: string;
  requiredRule?: string;
}

export interface ExtractionStats {
  total: number;
  panCount: number;
  validPanCount: number;
  hasNaFieldsCount: number;
  avgConfidence: number;
}
