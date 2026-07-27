import fs from "fs";

const line = fs
  .readFileSync(
    "C:/Users/devil/.cursor/projects/d-code-otto-lms-node-azure/agent-transcripts/e8c9a6ab-e9e2-412d-9a91-c7a39cdf569b/e8c9a6ab-e9e2-412d-9a91-c7a39cdf569b.jsonl",
    "utf8"
  )
  .split("\n")[111];

const terms = [
  "social-icons",
  "socialIcon",
  "elementSocialButtonType",
  ".css",
  "stylesheet",
  "mask-image",
  "background-image",
  "background-position"
];

for (const term of terms) {
  let idx = 0;
  let count = 0;
  while ((idx = line.indexOf(term, idx)) >= 0 && count < 3) {
    console.log(`\n=== ${term} #${count + 1} @ ${idx} ===`);
    console.log(line.slice(Math.max(0, idx - 80), idx + 200));
    idx += term.length;
    count++;
  }
}
