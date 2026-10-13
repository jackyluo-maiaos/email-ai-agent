import test from "node:test";
import assert from "node:assert/strict";
import { analyzeEmail, draftReply } from "../src/index.js";

test("detects a system newsletter", () => {
  const result = analyzeEmail({
    from: "newsletter@example.com",
    subject: "Weekly digest",
    body: "Product news",
    headers: { "List-Unsubscribe": "https://example.com/unsubscribe" },
  });
  assert.equal(result.classification.emailType, "system");
  assert.equal(result.deal, null);
});

test("extracts structured creator-deal fields", () => {
  const result = analyzeEmail({
    from: "partnerships@lumabeauty.example",
    fromName: "Luma Beauty Partnerships",
    subject: "Paid campaign collaboration",
    body: "Product: Glow Serum. Budget: $1,500 for 3 TikTok videos with 15% commission, a 30-day ad code, and 60-day usage rights.",
  });
  assert.equal(result.classification.emailType, "commercial");
  assert.equal(result.deal?.budgetUsd, 1500);
  assert.equal(result.deal?.productName, "Glow Serum");
  assert.equal(result.deal?.commissionPercent, 15);
  assert.equal(result.deal?.deliverable, "3 TikTok videos");
  assert.equal(result.deal?.adCodeDays, 30);
  assert.equal(result.deal?.usageRightsDays, 60);
});

test("draft asks only for missing fields and never sends", () => {
  const result = analyzeEmail({
    from: "maya@agency.example",
    subject: "Creator partnership campaign",
    body: "We would love to collaborate. Please share your rates.",
  });
  assert.ok(result.deal);
  const draft = draftReply(result.deal!, { creatorName: "Avery" });
  assert.ok(draft.asksFor.includes("the campaign budget"));
  assert.match(draft.body, /Thank you for reaching out/);
});
