#!/usr/bin/env node

/** Copy Tauri bundle output into release-artifacts/<platform> for CI aggregation. */

import fs from "node:fs";
import path from "node:path";

const platform = process.argv[2];
if (!platform) {
  console.error("usage: node collect-bundle.mjs <linux|macos|windows>");
  process.exit(1);
}

const targetRoot = path.resolve("apps/studio-desktop/src-tauri/target");
const bundleCandidates = [
  path.join(targetRoot, "release/bundle"),
  path.join(targetRoot, "universal-apple-darwin/release/bundle"),
  path.join(targetRoot, "x86_64-pc-windows-msvc/release/bundle"),
  path.join(targetRoot, "aarch64-apple-darwin/release/bundle"),
  path.join(targetRoot, "x86_64-unknown-linux-gnu/release/bundle"),
];

const bundleSrc = bundleCandidates.find((candidate) => fs.existsSync(candidate));
const dest = path.resolve(`release-artifacts/${platform}`);

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!bundleSrc) {
  console.error("[collect-bundle] missing bundle dir. Checked:");
  for (const candidate of bundleCandidates) console.error(`  - ${candidate}`);
  process.exit(1);
}

copyRecursive(bundleSrc, dest);
console.log(`[collect-bundle] ${bundleSrc} → ${dest}`);
