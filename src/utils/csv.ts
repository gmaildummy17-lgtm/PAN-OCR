import { IdentityCardRecord } from "../types";

/**
 * Validates PAN number format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
 */
export function isValidPanFormat(pan: string): boolean {
  if (!pan || pan.trim().toUpperCase() === "N/A") return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());
}

/**
 * Validates strictly DD/MM/YYYY format
 */
export function isValidDobFormat(dob: string): boolean {
  if (!dob || dob.trim().toUpperCase() === "N/A") return false;
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dob.trim())) return false;
  
  // Date sanity check
  const [day, month, year] = dob.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    year >= 1900 &&
    year <= 2030
  );
}

/**
 * Converts a string value to RFC-4180 CSV escaped cell
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates structured CSV string adhering strictly to the user prompt columns
 */
export function generateStructuredCsv(records: IdentityCardRecord[]): string {
  const headers = [
    "PAN Number",
    "Full Name",
    "Father's Name",
    "Date of Birth (DD/MM/YYYY)",
    "Card Type",
    "Document Number",
    "Confidence (%)",
    "Status",
    "File Name",
    "Extracted At",
  ];

  const rows = records.map((record) => [
    escapeCsvCell(record.panNumber || "N/A"),
    escapeCsvCell(record.fullName || "N/A"),
    escapeCsvCell(record.fatherName || "N/A"),
    escapeCsvCell(record.dob || "N/A"),
    escapeCsvCell(record.cardType || "N/A"),
    escapeCsvCell(record.documentNumber || "N/A"),
    escapeCsvCell(record.confidence),
    escapeCsvCell(record.status),
    escapeCsvCell(record.fileName || "manual_entry.csv"),
    escapeCsvCell(record.createdAt),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * Generates strict minimum 4-column CSV focused purely on the PAN card rules:
 * PAN Number, Full Name, Father's Name, Date of Birth
 */
export function generateStrictPanCsv(records: IdentityCardRecord[]): string {
  const headers = ["PAN Number", "Full Name", "Father's Name", "Date of Birth"];
  const rows = records.map((record) => [
    escapeCsvCell(record.panNumber || "N/A"),
    escapeCsvCell(record.fullName || "N/A"),
    escapeCsvCell(record.fatherName || "N/A"),
    escapeCsvCell(record.dob || "N/A"),
  ]);
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * Generates SQL DDL and INSERT statements for Database Integration
 */
export function generateSqlScript(records: IdentityCardRecord[], dialect: "postgres" | "mysql" = "postgres"): string {
  if (records.length === 0) {
    return `-- No records available. Scan cards to generate database insert statements.`;
  }

  const tableName = "identity_card_records";
  const dateCol = dialect === "postgres" ? "DATE" : "DATE";

  let ddl = `-- Database Schema for Identity Card OCR Extraction\n`;
  ddl += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  ddl += `  id VARCHAR(64) PRIMARY KEY,\n`;
  ddl += `  pan_number VARCHAR(10) NOT NULL, -- Format: [A-Z]{5}[0-9]{4}[A-Z] or 'N/A'\n`;
  ddl += `  full_name VARCHAR(255) NOT NULL,\n`;
  ddl += `  father_name VARCHAR(255) NOT NULL,\n`;
  ddl += `  dob_formatted VARCHAR(10) NOT NULL, -- DD/MM/YYYY or 'N/A'\n`;
  ddl += `  card_type VARCHAR(50) DEFAULT 'PAN Card',\n`;
  ddl += `  document_number VARCHAR(100),\n`;
  ddl += `  confidence_score INTEGER DEFAULT 0,\n`;
  ddl += `  verification_status VARCHAR(20) DEFAULT 'unverified',\n`;
  ddl += `  source_file VARCHAR(255),\n`;
  ddl += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
  ddl += `);\n\n`;

  ddl += `-- Batch Insert Statements (${records.length} records)\n`;
  
  const insertRows = records.map((r) => {
    const esc = (v: string) => `'${(v || "N/A").replace(/'/g, "''")}'`;
    return `  (${esc(r.id)}, ${esc(r.panNumber)}, ${esc(r.fullName)}, ${esc(r.fatherName)}, ${esc(r.dob)}, ${esc(r.cardType)}, ${esc(r.documentNumber)}, ${r.confidence}, ${esc(r.status)}, ${esc(r.fileName)})`;
  });

  const sqlInsert = `INSERT INTO ${tableName} (\n  id, pan_number, full_name, father_name, dob_formatted, card_type, document_number, confidence_score, verification_status, source_file\n) VALUES\n${insertRows.join(",\n")};\n`;

  return ddl + sqlInsert;
}

/**
 * Downloads a string as a file in the browser
 */
export function downloadFile(content: string, fileName: string, mimeType: string = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Simple CSV parser to import existing records
 */
export function parseCsvToRecords(csvText: string): Partial<IdentityCardRecord>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const records: Partial<IdentityCardRecord>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic regex-based CSV splitter respecting quotes
    const cells = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
    const cleaned = cells.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());

    const record: Partial<IdentityCardRecord> = {
      id: `imported-${Date.now()}-${i}`,
      panNumber: "N/A",
      fullName: "N/A",
      fatherName: "N/A",
      dob: "N/A",
      cardType: "PAN Card",
      documentNumber: "N/A",
      confidence: 90,
      status: "verified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    headers.forEach((h, idx) => {
      const val = cleaned[idx] || "N/A";
      if (h.includes("pan")) record.panNumber = val;
      else if (h.includes("father")) record.fatherName = val;
      else if (h.includes("full") || h.includes("name")) record.fullName = val;
      else if (h.includes("birth") || h.includes("dob")) record.dob = val;
      else if (h.includes("type")) record.cardType = val;
      else if (h.includes("doc")) record.documentNumber = val;
    });

    records.push(record);
  }

  return records;
}
