import { IdentityCardRecord } from "../types";

export interface SampleCardItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  cardType: string;
  presetExtraction: Omit<IdentityCardRecord, "id" | "createdAt" | "updatedAt">;
  svgImage: string;
}

// Function to generate an SVG data URL for a realistic Indian PAN Card
function createPanSvg(options: {
  pan: string;
  name: string;
  fatherName: string;
  dob: string;
  hasBlurDob?: boolean;
  hasMissingFather?: boolean;
}): string {
  const { pan, name, fatherName, dob, hasBlurDob, hasMissingFather } = options;

  const fatherDisplay = hasMissingFather ? "--- UNREADABLE / CUT OFF ---" : fatherName;
  const dobDisplay = hasBlurDob ? "XX/XX/XXXX [WORN]" : dob;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#0f172a; border-radius:16px; font-family:'Segoe UI', Roboto, sans-serif;">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0284c7" />
        <stop offset="50%" stop-color="#0369a1" />
        <stop offset="100%" stop-color="#075985" />
      </linearGradient>
      <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#ec4899" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.8" />
      </linearGradient>
      <pattern id="cardPattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.05" />
      </pattern>
    </defs>
    
    <!-- Card Body -->
    <rect x="10" y="10" width="520" height="320" rx="14" fill="url(#cardGrad)" stroke="#38bdf8" stroke-width="2"/>
    <rect x="10" y="10" width="520" height="320" rx="14" fill="url(#cardPattern)" />
    
    <!-- Top Header Banner -->
    <rect x="25" y="22" width="490" height="48" rx="8" fill="#ffffff" fill-opacity="0.12" />
    <text x="40" y="42" font-size="11" font-weight="700" fill="#f8fafc" letter-spacing="1">आयकर विभाग</text>
    <text x="40" y="58" font-size="13" font-weight="800" fill="#ffffff" letter-spacing="1.5">INCOME TAX DEPARTMENT</text>
    <text x="360" y="42" font-size="10" font-weight="600" fill="#cbd5e1">भारत सरकार</text>
    <text x="360" y="58" font-size="12" font-weight="700" fill="#ffffff">GOVT. OF INDIA</text>

    <!-- Emblem Stamp -->
    <circle cx="310" cy="46" r="14" fill="#fbbf24" fill-opacity="0.3" stroke="#fef08a" stroke-width="1.5" />
    <text x="310" y="50" font-size="9" font-weight="900" text-anchor="middle" fill="#fef08a">🇮🇳</text>

    <!-- Photo Box -->
    <rect x="35" y="85" width="105" height="135" rx="6" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
    <circle cx="87" cy="130" r="28" fill="#475569" />
    <path d="M 50 195 Q 87 165 125 195 Z" fill="#64748b" />
    <text x="87" y="212" font-size="8" fill="#94a3b8" text-anchor="middle">PHOTO</text>

    <!-- Hologram Seal -->
    <rect x="390" y="85" width="95" height="70" rx="8" fill="url(#holoGrad)" stroke="#fcd34d" stroke-width="1" />
    <text x="437" y="118" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">SECURE</text>
    <text x="437" y="132" font-size="8" font-weight="600" fill="#ffffff" text-anchor="middle">AUTHENTIC</text>

    <!-- Fields -->
    <!-- Name -->
    <text x="160" y="100" font-size="9" font-weight="600" fill="#93c5fd" letter-spacing="0.5">नाम / Name</text>
    <text x="160" y="120" font-size="14" font-weight="800" fill="#ffffff" font-family="'JetBrains Mono', monospace">${name}</text>

    <!-- Father's Name -->
    <text x="160" y="145" font-size="9" font-weight="600" fill="#93c5fd" letter-spacing="0.5">पिता का नाम / Father's Name</text>
    <text x="160" y="165" font-size="13" font-weight="${hasMissingFather ? '400' : '700'}" fill="${hasMissingFather ? '#f87171' : '#ffffff'}">${fatherDisplay}</text>

    <!-- Date of Birth -->
    <text x="160" y="190" font-size="9" font-weight="600" fill="#93c5fd" letter-spacing="0.5">जन्म की तारीख / Date of Birth</text>
    <text x="160" y="210" font-size="13" font-weight="${hasBlurDob ? '400' : '700'}" fill="${hasBlurDob ? '#f87171' : '#38bdf8'}" font-family="'JetBrains Mono', monospace">${dobDisplay}</text>

    <!-- Signature Line -->
    <rect x="35" y="235" width="130" height="42" rx="4" fill="#0f172a" fill-opacity="0.6" stroke="#64748b" stroke-dasharray="2,2"/>
    <text x="100" y="260" font-size="14" font-family="cursive" fill="#94a3b8" text-anchor="middle">R. K. Sharma</text>
    <text x="100" y="272" font-size="7" fill="#64748b" text-anchor="middle">हस्ताक्षर / SIGNATURE</text>

    <!-- PAN Number Banner -->
    <rect x="180" y="232" width="320" height="48" rx="8" fill="#0b1329" stroke="#38bdf8" stroke-width="1.5" />
    <text x="195" y="250" font-size="8" font-weight="700" fill="#7dd3fc" letter-spacing="1">स्थायी लेखा संख्या कार्ड / PERMANENT ACCOUNT NUMBER</text>
    <text x="195" y="272" font-size="18" font-weight="900" fill="#38bdf8" letter-spacing="3" font-family="'JetBrains Mono', monospace">${pan}</text>

    <!-- Footer Microprint -->
    <text x="270" y="312" font-size="8" fill="#94a3b8" text-anchor="middle">Official Document of the Government of India • Under Rule 114B Income Tax Rules</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Function to generate an SVG for Aadhaar ID
function createAadhaarSvg(options: {
  aadhaarNumber: string;
  name: string;
  dob: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#ffffff; border-radius:16px; font-family:'Segoe UI', Roboto, sans-serif;">
    <rect x="10" y="10" width="520" height="320" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <!-- Top tricolor stripe -->
    <rect x="10" y="10" width="520" height="8" fill="#f97316" rx="4 4 0 0" />
    <rect x="10" y="18" width="520" height="6" fill="#ffffff" />
    <rect x="10" y="24" width="520" height="6" fill="#16a34a" />

    <text x="270" y="55" font-size="14" font-weight="800" fill="#1e293b" text-anchor="middle">UNIQUE IDENTIFICATION AUTHORITY OF INDIA</text>
    <text x="270" y="70" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">Government of India / भारत सरकार</text>

    <!-- Photo -->
    <rect x="40" y="90" width="100" height="125" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <circle cx="90" cy="135" r="26" fill="#94a3b8" />
    <path d="M 55 195 Q 90 170 125 195 Z" fill="#64748b" />

    <!-- Details -->
    <text x="165" y="110" font-size="11" font-weight="600" fill="#64748b">Name / नाम:</text>
    <text x="165" y="130" font-size="16" font-weight="800" fill="#0f172a">${options.name}</text>

    <text x="165" y="160" font-size="11" font-weight="600" fill="#64748b">Date of Birth / जन्म तिथि:</text>
    <text x="165" y="180" font-size="14" font-weight="700" fill="#1e293b" font-family="'JetBrains Mono', monospace">${options.dob}</text>

    <text x="165" y="205" font-size="11" font-weight="600" fill="#64748b">Gender / लिंग: FEMALE / महिला</text>

    <!-- Aadhaar Number -->
    <rect x="40" y="240" width="460" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="270" y="272" font-size="20" font-weight="800" fill="#dc2626" text-anchor="middle" letter-spacing="4" font-family="'JetBrains Mono', monospace">${options.aadhaarNumber}</text>

    <text x="270" y="315" font-size="10" font-weight="700" fill="#475569" text-anchor="middle">मेरा आधार, मेरी पहचान (Aadhaar is proof of identity, not of citizenship)</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_CARDS: SampleCardItem[] = [
  {
    id: "sample-pan-complete",
    title: "Standard PAN Card",
    description: "Complete valid PAN card with all 4 required fields clearly visible.",
    badge: "Full Match (100%)",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cardType: "PAN Card",
    presetExtraction: {
      panNumber: "ABCPS1234K",
      fullName: "RAJESH KUMAR SHARMA",
      fatherName: "SURESH KUMAR SHARMA",
      dob: "14/07/1986",
      cardType: "PAN Card",
      documentNumber: "N/A",
      confidence: 99,
      status: "verified",
      fileName: "pan_rajesh_sharma.jpg",
      rawExtractedText:
        "INCOME TAX DEPARTMENT GOVT OF INDIA\nRAJESH KUMAR SHARMA\nSURESH KUMAR SHARMA\n14/07/1986\nPERMANENT ACCOUNT NUMBER: ABCPS1234K",
      notes: "Valid PAN card extracted with 100% field compliance.",
    },
    svgImage: createPanSvg({
      pan: "ABCPS1234K",
      name: "RAJESH KUMAR SHARMA",
      fatherName: "SURESH KUMAR SHARMA",
      dob: "14/07/1986",
    }),
  },
  {
    id: "sample-pan-na-father",
    title: "PAN (Missing Father Name)",
    description: "Tests the strict 'N/A' rule when Father's Name is omitted or obscured.",
    badge: "Father Name = N/A",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    cardType: "PAN Card",
    presetExtraction: {
      panNumber: "BNKPP9876M",
      fullName: "PRIYA VERMA",
      fatherName: "N/A",
      dob: "28/11/1993",
      cardType: "PAN Card",
      documentNumber: "N/A",
      confidence: 94,
      status: "flagged",
      fileName: "pan_priya_verma.jpg",
      rawExtractedText:
        "INCOME TAX DEPARTMENT GOVT OF INDIA\nPRIYA VERMA\n[FATHER NAME NOT VISIBLE / UNREADABLE]\n28/11/1993\nPERMANENT ACCOUNT NUMBER: BNKPP9876M",
      notes: "Father's Name missing on card; filled with strict 'N/A' per specification.",
    },
    svgImage: createPanSvg({
      pan: "BNKPP9876M",
      name: "PRIYA VERMA",
      fatherName: "",
      dob: "28/11/1993",
      hasMissingFather: true,
    }),
  },
  {
    id: "sample-pan-na-dob",
    title: "Worn PAN (Unreadable DOB)",
    description: "Tests strict 'N/A' rule when DOB is scratched/unreadable.",
    badge: "DOB = N/A",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    cardType: "PAN Card",
    presetExtraction: {
      panNumber: "DFGTY5432Q",
      fullName: "AMITABH PATEL",
      fatherName: "RAMESH PATEL",
      dob: "N/A",
      cardType: "PAN Card",
      documentNumber: "N/A",
      confidence: 91,
      status: "flagged",
      fileName: "pan_amitabh_scratched.jpg",
      rawExtractedText:
        "INCOME TAX DEPARTMENT GOVT OF INDIA\nAMITABH PATEL\nRAMESH PATEL\nDOB: XX/XX/XXXX [ILLEGIBLE SCRATCH]\nPERMANENT ACCOUNT NUMBER: DFGTY5432Q",
      notes: "Date of Birth unreadable due to card scratch; populated with 'N/A'.",
    },
    svgImage: createPanSvg({
      pan: "DFGTY5432Q",
      name: "AMITABH PATEL",
      fatherName: "RAMESH PATEL",
      dob: "",
      hasBlurDob: true,
    }),
  },
  {
    id: "sample-aadhaar-test",
    title: "Aadhaar Card (Non-PAN)",
    description: "Tests identity card rules: PAN Number set to N/A, ID captured.",
    badge: "PAN = N/A (Non-PAN ID)",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    cardType: "Aadhaar Card",
    presetExtraction: {
      panNumber: "N/A",
      fullName: "SUNITA DEVI",
      fatherName: "N/A",
      dob: "02/05/1979",
      cardType: "Aadhaar Card",
      documentNumber: "5482 1928 8921",
      confidence: 97,
      status: "verified",
      fileName: "aadhaar_sunita_devi.jpg",
      rawExtractedText:
        "UNIQUE IDENTIFICATION AUTHORITY OF INDIA\nSUNITA DEVI\nDOB: 02/05/1979\n5482 1928 8921",
      notes: "Document is Aadhaar Card. PAN Number correctly marked 'N/A'.",
    },
    svgImage: createAadhaarSvg({
      name: "SUNITA DEVI",
      dob: "02/05/1979",
      aadhaarNumber: "5482 1928 8921",
    }),
  },
];
