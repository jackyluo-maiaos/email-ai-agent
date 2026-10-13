import type { AnalyzeOptions, ClassificationResult, EmailInput, SenderType } from "./types.js";

const SYSTEM_LOCAL_PARTS = /^(?:no-?reply|notifications?|newsletter|updates?|alerts?|receipts?|security)$/i;
const SYSTEM_SUBJECTS = /\b(?:password reset|security alert|verification code|weekly digest|daily digest|receipt|invoice available|your statement|newsletter|unsubscribe)\b/i;
const COMMERCIAL_TERMS = /\b(?:collab(?:oration)?|campaign|partnership|sponsor(?:ed|ship)?|brand deal|paid content|creator brief|deliverable|usage rights?|ad code|commission|rate card|gifted)\b/i;
const AGENCY_TERMS = /\b(?:agency|talent|management|media|influencer marketing|creator network)\b/i;

function senderParts(from: string) {
  const match = from.toLowerCase().match(/<?([^<>\s]+)@([^<>\s]+)>?$/);
  return { local: match?.[1] ?? "", domain: match?.[2] ?? "" };
}

function normalizeList(values: string[] | undefined) {
  return new Set((values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function inferSenderType(email: EmailInput, commercial: boolean): SenderType {
  const source = `${email.fromName ?? ""} ${email.from} ${email.subject}`;
  if (AGENCY_TERMS.test(source)) return "agency";
  if (commercial) return "brand";
  return "unknown";
}

export function classifyEmail(email: EmailInput, options: AnalyzeOptions = {}): ClassificationResult {
  const reasons: string[] = [];
  const { local, domain } = senderParts(email.from);
  const exactSystemSenders = normalizeList(options.systemSenders);
  const systemDomains = normalizeList(options.systemDomains);
  const headers = Object.fromEntries(
    Object.entries(email.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );

  if (exactSystemSenders.has(`${local}@${domain}`)) reasons.push("known_system_sender");
  if (systemDomains.has(domain)) reasons.push("known_system_domain");
  if (SYSTEM_LOCAL_PARTS.test(local)) reasons.push("automated_sender_pattern");
  if (SYSTEM_SUBJECTS.test(email.subject)) reasons.push("system_subject_pattern");
  if (headers["list-unsubscribe"] || headers["list-id"]) reasons.push("mailing_list_header");
  if (/auto-(?:generated|replied)/i.test(headers["auto-submitted"] ?? "")) reasons.push("auto_submitted_header");

  if (reasons.length > 0) {
    return { emailType: "system", senderType: "unknown", confidence: Math.min(0.99, 0.78 + reasons.length * 0.06), reasons };
  }

  const content = `${email.subject}\n${email.body}`;
  const commercialMatches = content.match(new RegExp(COMMERCIAL_TERMS.source, "gi"))?.length ?? 0;
  if (commercialMatches > 0) {
    reasons.push("commercial_language");
    return {
      emailType: "commercial",
      senderType: inferSenderType(email, true),
      confidence: Math.min(0.96, 0.68 + commercialMatches * 0.06),
      reasons,
    };
  }

  return { emailType: "other", senderType: inferSenderType(email, false), confidence: 0.55, reasons: ["no_decisive_signal"] };
}
