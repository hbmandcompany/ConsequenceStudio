#!/usr/bin/env node
/**
 * Ensure Tauri updater signing is only enabled when a valid private key is present.
 * Prevents release builds from failing after bundling when CI secrets are missing/malformed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const confPath = resolve(root, "apps/studio-desktop/src-tauri/tauri.conf.json");

function keyLooksValid(raw) {
  const value = raw?.trim();
  if (!value) return false;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    if (decoded.includes("untrusted comment:")) return true;
  } catch {
    // not base64 — fall through to plaintext minisign format
  }
  return value.includes("untrusted comment:");
}

const key = process.env.TAURI_SIGNING_PRIVATE_KEY ?? "";
const conf = JSON.parse(readFileSync(confPath, "utf8"));
const signingEnabled = keyLooksValid(key);

if (!signingEnabled) {
  if (conf.bundle?.createUpdaterArtifacts) {
    conf.bundle.createUpdaterArtifacts = false;
    writeFileSync(confPath, `${JSON.stringify(conf, null, 2)}\n`);
    console.warn(
      "[ci] TAURI_SIGNING_PRIVATE_KEY missing or invalid — disabled createUpdaterArtifacts for this build",
    );
  }
} else {
  console.log("[ci] TAURI_SIGNING_PRIVATE_KEY present — updater artifacts enabled");
}
