import type { EmailInput } from "./types.js";

export const PUBLIC_DEAL_SCHEMA = {
  brandName: "string|null",
  productName: "string|null",
  dealType: "flat_rate|commission|gifted|mixed|missing_information",
  budgetUsd: "number|null",
  commissionPercent: "number|null",
  deliverable: "string|null",
  adCodeDays: "7|30|60|90|180|365|null",
  usageRightsDays: "30|60|90|180|365|null",
  missingFields: "string[]",
  summary: "string",
} as const;

export function buildExtractionPrompt(email: EmailInput) {
  return [
    "You analyze creator partnership emails.",
    "Return JSON only and never invent missing commercial terms.",
    `Schema: ${JSON.stringify(PUBLIC_DEAL_SCHEMA)}`,
    `From: ${email.fromName ? `${email.fromName} ` : ""}<${email.from}>`,
    `Subject: ${email.subject}`,
    "Body:",
    email.body,
  ].join("\n");
}
