#!/usr/bin/env node

/**
 * Build Tauri updater manifest (latest.json) from signed release artifacts.
 * Hosted at: https://github.com/hbmandcompany/Consequence/releases/latest/download/latest.json
 */

import fs from "node:fs";
import path from "node:path";

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function readSignature(sigPath) {
  return fs.readFileSync(sigPath, "utf8").trim();
}

function urlForName(uploaded, name) {
  return uploaded.find((a) => a.name === name)?.browser_download_url ?? "";
}

/**
 * @param {string} artifactsDir
 * @param {string} version
 * @param {Array<{ name: string, browser_download_url: string }>} uploaded
 */
export function buildLatestJson(artifactsDir, version, uploaded = []) {
  const files = walkFiles(artifactsDir);
  const platforms = {};

  const setPlatform = (key, installerPath, signature) => {
    const name = path.basename(installerPath);
    platforms[key] = {
      signature,
      url: urlForName(uploaded, name),
    };
  };

  for (const filePath of files) {
    const base = path.basename(filePath);
    const lower = base.toLowerCase();
    const sigPath = `${filePath}.sig`;
    if (!fs.existsSync(sigPath)) continue;

    const signature = readSignature(sigPath);

    if (lower.endsWith(".appimage")) {
      setPlatform("linux-x86_64", filePath, signature);
      continue;
    }

    if (lower.endsWith(".exe") && lower.includes("setup")) {
      setPlatform("windows-x86_64", filePath, signature);
      continue;
    }

    if (lower.endsWith(".app.tar.gz")) {
      const entry = { signature, url: urlForName(uploaded, base) };
      platforms["darwin-aarch64"] = { ...entry };
      platforms["darwin-x86_64"] = { ...entry };
    }
  }

  return {
    version,
    notes: `ConsequenceStudio ${version}`,
    pub_date: new Date().toISOString(),
    platforms,
  };
}

export function writeLatestJson(artifactsDir, manifest) {
  const outPath = path.join(artifactsDir, "latest.json");
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return outPath;
}
