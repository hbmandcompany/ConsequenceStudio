#!/usr/bin/env node

/** Copy Tauri bundle output into release-artifacts/<platform> for CI aggregation. */

import fs from "node:fs";
import path from "node:path";

const platform = process.argv[2];
if (!platform) {
  console.error("usage: node collect-bundle.mjs <linux|macos|windows>");
  process.exit(1);
}

const bundleSrc = path.resolve(
  "apps/studio-desktop/src-tauri/target/release/bundle",
);
const dest = path.resolve(`release-artifacts/${platform}`);

function copyRecursive(src, dst) {
  if (!fs.existsSync(src)) {
    console.error(`[collect-bundle] missing bundle dir: ${src}`);
    process.exit(1);
  }
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

copyRecursive(bundleSrc, dest);
console.log(`[collect-bundle] ${bundleSrc} → ${dest}`);
