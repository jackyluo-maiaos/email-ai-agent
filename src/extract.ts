import type { DealExtraction, DealType, EmailInput } from "./types.js";

const MONEY = /(?:budget|rate|fee|offer|compensation)(?:\s+(?:is|of))?\s*[:\-]?\s*\$\s*([\d,.]+)/i;
const COMMISSION_LABEL_FIRST = /(?:commission|affiliate rate)(?:\s+(?:is|of))?\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i;
const COMMISSION_VALUE_FIRST = /(\d{1,2}(?:\.\d+)?)\s*%\s*(?:commission|affiliate rate)/i;
const DELIVERABLE = /\b(\d+)\s*(TikTok|YouTube|Instagram|Reels?|Shorts?|UGC)?\s*(?:posts?|videos?|reels?|shorts?)\b/i;
const AD_CODE = /\b(7|30|60|90|180|365)[-\s]*day\s+ad\s+code\b/i;
const USAGE = /\b(30|60|90|180|365)[-\s]*day\s+(?:paid\s+)?usage(?:\s+rights?)?\b/i;
const PRODUCT_LABEL = /(?:product|campaign product)\s*[:\-]\s*([^\n.,;]{2,80})/i;
const PRODUCT_ACTION = /(?:featuring|promote)\s+(?:our\s+|the\s+)?([^\n.,;:]{2,80})/i;

function cleanName(value: string | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/\b(?:team|partnerships?|influencer marketing|creator relations?)\b/gi, "").replace(/[|–—-]+$/g, "").trim();
  return cleaned || null;
}

function domainBrand(from: string) {
  const domain = from.toLowerCase().match(/@([^<>\s]+)>?$/)?.[1];
  if (!domain || /^(?:gmail|outlook|hotmail|yahoo|icloud)\./.test(domain)) return null;
  const root = domain.split(".").slice(-2, -1)[0] ?? "";
  return root ? root.charAt(0).toUpperCase() + root.slice(1) : null;
}

function numberMatch(source: string, pattern: RegExp) {
  const raw = source.match(pattern)?.[1];
  return raw ? Number(raw.replace(/,/g, "")) : null;
}

function firstNumberMatch(source: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const value = numberMatch(source, pattern);
    if (value !== null) return value;
  }
  return null;
}

function detectDealType(source: string, budget: number | null, commission: number | null): DealType {
  const gifted = /\b(?:gifted|product only|free product|product exchange)\b/i.test(source);
  if (budget !== null && commission !== null) return "mixed";
  if (budget !== null) return "flat_rate";
  if (commission !== null) return "commission";
  if (gifted) return "gifted";
  return "missing_information";
}

export function extractDeal(email: EmailInput): DealExtraction {
  const source = `${email.subject}\n${email.body}`.replace(/\r/g, "");
  const budgetUsd = numberMatch(source, MONEY);
  const commissionPercent = firstNumberMatch(source, [COMMISSION_LABEL_FIRST, COMMISSION_VALUE_FIRST]);
  const deliverableMatch = source.match(DELIVERABLE);
  const deliverable = deliverableMatch
    ? `${deliverableMatch[1]} ${deliverableMatch[2] ?? "content"} ${Number(deliverableMatch[1]) === 1 ? "video" : "videos"}`
    : null;
  const productName = source.match(PRODUCT_LABEL)?.[1]?.trim()
    ?? source.match(PRODUCT_ACTION)?.[1]?.trim()
    ?? null;
  const brandName = cleanName(email.fromName) ?? domainBrand(email.from);
  const adCodeDays = numberMatch(source, AD_CODE);
  const usageRightsDays = numberMatch(source, USAGE);
  const dealType = detectDealType(source, budgetUsd, commissionPercent);
  const missingFields: DealExtraction["missingFields"] = [];
  if (!brandName) missingFields.push("brandName");
  if (!productName) missingFields.push("productName");
  if (budgetUsd === null && dealType !== "gifted" && dealType !== "commission") missingFields.push("budget");
  if (!deliverable) missingFields.push("deliverable");

  const known = [
    brandName && `Brand: ${brandName}`,
    productName && `Product: ${productName}`,
    budgetUsd !== null && `Budget: $${budgetUsd}`,
    commissionPercent !== null && `Commission: ${commissionPercent}%`,
    deliverable && `Deliverable: ${deliverable}`,
  ].filter(Boolean);

  return {
    brandName,
    productName,
    dealType,
    budgetUsd,
    commissionPercent,
    deliverable,
    adCodeDays,
    usageRightsDays,
    missingFields,
    summary: known.length ? known.join(" · ") : "Potential creator partnership; key commercial terms are missing.",
  };
}
