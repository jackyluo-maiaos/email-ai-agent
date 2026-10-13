import { readFile } from "node:fs/promises";
import { analyzeEmail, draftReply, type EmailInput } from "../src/index.js";

// The compiled demo runs from dist/examples, while fixtures remain in examples/.
const fixtureUrl = new URL("../../examples/sample-emails.json", import.meta.url);
const emails = JSON.parse(await readFile(fixtureUrl, "utf8")) as EmailInput[];

for (const email of emails) {
  const result = analyzeEmail(email);
  console.log(`\n${email.subject}`);
  console.log(JSON.stringify(result, null, 2));
  if (result.deal) {
    console.log(draftReply(result.deal, {
      creatorName: "Avery Chen",
      specialties: ["beauty", "skincare"],
      rates: [{ deliverable: "1 TikTok video", priceUsd: 500 }],
      paymentTerms: "50% upfront, balance Net 7",
    }).body);
  }
}
