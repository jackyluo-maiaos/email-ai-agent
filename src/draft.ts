import type { CreatorProfile, DealExtraction, DraftReply } from "./types.js";

const LABELS: Record<DealExtraction["missingFields"][number], string> = {
  brandName: "the brand or agency you represent",
  productName: "the product or campaign",
  budget: "the campaign budget",
  deliverable: "the requested deliverables",
};

export function draftReply(deal: DealExtraction, creator: CreatorProfile): DraftReply {
  const asksFor = deal.missingFields.map((field) => LABELS[field]);
  const greeting = deal.brandName ? `Hi ${deal.brandName} team,` : "Hi,";
  const specialty = creator.specialties?.length
    ? `${creator.creatorName} creates content focused on ${creator.specialties.join(", ")}.`
    : `${creator.creatorName} creates performance-focused creator content.`;
  const showcases = creator.showcaseLinks?.length
    ? `\n\nSelected work:\n${creator.showcaseLinks.map((url) => `- ${url}`).join("\n")}`
    : "";
  const rates = creator.rates?.length
    ? `\n\nRates:\n${creator.rates.map((rate) => `- ${rate.deliverable}: $${rate.priceUsd}`).join("\n")}`
    : "";
  const missing = asksFor.length
    ? `\n\nCould you also share ${asksFor.join(", ")}?`
    : "\n\nThe campaign details look complete. We would be happy to discuss next steps.";
  const terms = creator.paymentTerms ? `\n\nPayment terms: ${creator.paymentTerms}` : "";

  return {
    subject: deal.brandName ? `Re: ${deal.brandName} partnership` : "Re: Partnership opportunity",
    body: `${greeting}\n\nThank you for reaching out. ${specialty}${showcases}${rates}${missing}${terms}\n\n${creator.signature ?? `Best,\n${creator.creatorName}`}`,
    asksFor,
  };
}
