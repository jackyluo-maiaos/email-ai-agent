export type EmailType = "commercial" | "system" | "other";
export type SenderType = "brand" | "agency" | "unknown";
export type DealType = "flat_rate" | "commission" | "gifted" | "mixed" | "missing_information";

export interface EmailInput {
  id?: string;
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  headers?: Record<string, string | undefined>;
  receivedAt?: string;
}

export interface ClassificationResult {
  emailType: EmailType;
  senderType: SenderType;
  confidence: number;
  reasons: string[];
}

export interface DealExtraction {
  brandName: string | null;
  productName: string | null;
  dealType: DealType;
  budgetUsd: number | null;
  commissionPercent: number | null;
  deliverable: string | null;
  adCodeDays: number | null;
  usageRightsDays: number | null;
  missingFields: Array<"brandName" | "productName" | "budget" | "deliverable">;
  summary: string;
}

export interface CreatorProfile {
  creatorName: string;
  specialties?: string[];
  showcaseLinks?: string[];
  rates?: Array<{ deliverable: string; priceUsd: number }>;
  adCodeRate?: { days: number; priceUsd: number };
  usageRightRate?: { days: number; priceUsd: number };
  paymentTerms?: string;
  signature?: string;
}

export interface DraftReply {
  subject: string;
  body: string;
  asksFor: string[];
}

export interface AnalyzeOptions {
  systemSenders?: string[];
  systemDomains?: string[];
}

export interface AnalysisResult {
  classification: ClassificationResult;
  deal: DealExtraction | null;
}
