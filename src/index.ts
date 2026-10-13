import { classifyEmail } from "./classify.js";
import { extractDeal } from "./extract.js";
import type { AnalysisResult, AnalyzeOptions, EmailInput } from "./types.js";

export * from "./types.js";
export * from "./classify.js";
export * from "./extract.js";
export * from "./draft.js";
export * from "./prompt.js";

export function analyzeEmail(email: EmailInput, options?: AnalyzeOptions): AnalysisResult {
  const classification = classifyEmail(email, options);
  return {
    classification,
    deal: classification.emailType === "commercial" ? extractDeal(email) : null,
  };
}
