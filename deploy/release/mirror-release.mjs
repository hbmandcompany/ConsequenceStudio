#!/usr/bin/env node

/**
 * Tag release pipeline: collect Tauri installers, publish downloads.json,
 * create a GitLab Release, and mirror binaries to GitHub Releases.
 *
 * GitLab is the source of truth (tag here). GitHub hosts stable download URLs.
 *
 * Required CI variables:
 *   GH_RELEASE_TOKEN — GitHub Actions (GITHUB_TOKEN is reserved by Actions)
 *   GITHUB_TOKEN / Github — GitLab CI
 *   GITHUB_REPO    — e.g. hbmandcompany/Consequence
 *
 * Optional:
 *   GITLAB_TOKEN   — defaults to CI_JOB_TOKEN
 *   RELEASE_ARTIFACTS_DIR — default release-artifacts
 *   DOWNLOADS_MANIFEST_URL — public URL for downloads.json (written into manifest)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

const INSTALLER_EXTENSIONS = new Set([
  ".exe",
  ".msi",
  ".dmg",
  ".deb",
  ".appimage",
]);

const PLATFORM_PICK_ORDER = {
  windows: [".exe", ".msi"],
  macos: [".dmg"],
  linux: [".appimage", ".deb"],
};

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`[release] ${msg}\n`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function isInstaller(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return INSTALLER_EXTENSIONS.has(ext);
}

function detectPlatform(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".exe" || ext === ".msi") return "windows";
  if (ext === ".dmg") return "macos";
  if (ext === ".deb" || ext === ".appimage") return "linux";
  return null;
}

function pickPrimaryInstallers(files) {
  const byPlatform = { windows: [], macos: [], linux: [] };
  for (const file of files) {
    const platform = detectPlatform(file);
    if (platform) byPlatform[platform].push(file);
  }

  const picked = {};
  for (const [platform, order] of Object.entries(PLATFORM_PICK_ORDER)) {
    const candidates = byPlatform[platform];
    if (!candidates.length) continue;
    candidates.sort((a, b) => {
      const extA = path.extname(a).toLowerCase();
      const extB = path.extname(b).toLowerCase();
      return order.indexOf(extA) - order.indexOf(extB);
    });
    picked[platform] = candidates[0];
  }
  return picked;
}

function resolveVersion(tag) {
  if (tag) return tag.replace(/^v/i, "");
  const tauriConf = readJson(
    path.join(REPO_ROOT, "apps/studio-desktop/src-tauri/tauri.conf.json"),
  );
  return tauriConf.version;
}

async function ghRequest(token, method, url, body, isJson = true) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  let payload;
  if (body !== undefined) {
    if (isJson) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    } else {
      payload = body;
    }
  }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`GitHub ${method} ${url} → ${res.status}: ${text}`);
  }
  return data;
}

async function glRequest(token, method, url, body) {
  const headers = {
    "PRIVATE-TOKEN": token,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`GitLab ${method} ${url} → ${res.status}: ${text}`);
  }
  return data;
}

async function ensureGitHubRelease(token, repo, tag, version) {
  const base = `https://api.github.com/repos/${repo}`;
  try {
    return await ghRequest(token, "GET", `${base}/releases/tags/${encodeURIComponent(tag)}`);
  } catch {
    log(`[release] creating GitHub release ${tag}`);
    return ghRequest(token, "POST", `${base}/releases`, {
      tag_name: tag,
      name: `ConsequenceStudio ${version}`,
      body: [
        "Native desktop DAW by HBM & Company.",
        "",
        `Download installers for Windows, macOS, and Linux from the assets below.`,
        "",
        `Source: GitLab tag \`${tag}\` (mirrored automatically).`,
      ].join("\n"),
      draft: false,
      prerelease: false,
    });
  }
}

async function refreshGitHubRelease(token, repo, release) {
  return ghRequest(
    token,
    "GET",
    `https://api.github.com/repos/${repo}/releases/${release.id}`,
  );
}

async function deleteGitHubAsset(token, repo, assetId) {
  await ghRequest(
    token,
    "DELETE",
    `https://api.github.com/repos/${repo}/releases/assets/${assetId}`,
  );
}

async function uploadGitHubAsset(token, repo, release, filePath) {
  const name = path.basename(filePath);
  const stat = fs.statSync(filePath);
  const existing = (release.assets ?? []).find((a) => a.name === name);
  if (existing) {
    log(`[release] replacing existing GitHub asset: ${name}`);
    await deleteGitHubAsset(token, repo, existing.id);
  }

  const url = release.upload_url.replace("{?name,label}", `?name=${encodeURIComponent(name)}`);
  log(`[release] uploading to GitHub: ${name} (${stat.size} bytes)`);

  const buffer = fs.readFileSync(filePath);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/octet-stream",
      "Content-Length": String(stat.size),
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: buffer,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub asset upload ${name} → ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

async function createGitLabRelease(token, projectId, apiBase, tag, version, assetLinks) {
  const url = `${apiBase}/projects/${encodeURIComponent(projectId)}/releases`;
  const body = {
    name: `ConsequenceStudio ${version}`,
    tag_name: tag,
    description: [
      "ConsequenceStudio release (GitLab source of truth).",
      "",
      "Installers are mirrored to GitHub Releases for stable public download URLs.",
      "",
      ...assetLinks.map((a) => `- [${a.name}](${a.url})`),
    ].join("\n"),
    assets: {
      links: assetLinks.map((a) => ({
        name: a.name,
        url: a.url,
        link_type: "package",
      })),
    },
  };

  try {
    await glRequest(token, "POST", url, body);
    log(`[release] created GitLab release ${tag}`);
  } catch (err) {
    if (String(err.message).includes("409")) {
      log(`[release] GitLab release ${tag} already exists — updating asset links`);
      const linkUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/releases/${encodeURIComponent(tag)}/assets/links`;
      for (const asset of body.assets.links) {
        await glRequest(token, "POST", linkUrl, asset);
      }
      return;
    }
    throw err;
  }
}

function normalizeGithubRepo(value) {
  const trimmed = value.trim().replace(/\/$/, "");
  const match = trimmed.match(/github\.com\/([^/]+\/[^/]+)/i);
  if (match) return match[1];
  return trimmed;
}

async function main() {
  const tag = process.env.CI_COMMIT_TAG;
  if (!tag) fail("CI_COMMIT_TAG is required (push a tag like v0.1.0)");

  const githubToken =
    process.env.GH_RELEASE_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.Github?.trim();
  if (!githubToken) {
    fail(
      "GH_RELEASE_TOKEN (or GITHUB_TOKEN / Github) is required to mirror releases to GitHub",
    );
  }

  const githubRepo = normalizeGithubRepo(process.env.GITHUB_REPO ?? "");
  if (!githubRepo) fail("GITHUB_REPO is required (e.g. hbmandcompany/Consequence)");

  const artifactsDir = path.resolve(
    process.env.RELEASE_ARTIFACTS_DIR ?? path.join(REPO_ROOT, "release-artifacts"),
  );
  const version = resolveVersion(tag);
  const allFiles = walkFiles(artifactsDir).filter(isInstaller);

  if (!allFiles.length) {
    fail(`no installer artifacts found under ${artifactsDir}`);
  }

  log(`[release] tag=${tag} version=${version} installers=${allFiles.length}`);

  const primary = pickPrimaryInstallers(allFiles);
  const ghRelease = await ensureGitHubRelease(githubToken, githubRepo, tag, version);

  let ghReleaseState = await refreshGitHubRelease(githubToken, githubRepo, ghRelease);
  const uploaded = [];
  for (const filePath of allFiles) {
    const asset = await uploadGitHubAsset(
      githubToken,
      githubRepo,
      ghReleaseState,
      filePath,
    );
    uploaded.push(asset);
    ghReleaseState = await refreshGitHubRelease(githubToken, githubRepo, ghReleaseState);
  }

  const downloads = {};
  const filenames = {};
  for (const [platform, filePath] of Object.entries(primary)) {
    const name = path.basename(filePath);
    const match = uploaded.find((a) => a.name === name);
    if (match?.browser_download_url) {
      downloads[platform] = match.browser_download_url;
      filenames[platform] = name;
    }
  }

  const manifest = {
    product: "ConsequenceStudio",
    displayName: "Consequence",
    version,
    tag,
    releasedAt: new Date().toISOString().slice(0, 10),
    publisher: "HBM & Company",
    website: "https://consequence.software",
    source: {
      gitlab: process.env.CI_PROJECT_URL ?? null,
      github: `https://github.com/${githubRepo}`,
    },
    downloads,
    filenames,
    allAssets: uploaded.map((a) => ({
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
      content_type: a.content_type,
    })),
  };

  const manifestPath = path.join(artifactsDir, "downloads.json");
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const manifestAsset = await uploadGitHubAsset(
    githubToken,
    githubRepo,
    ghReleaseState,
    manifestPath,
  );
  manifest.manifestUrl = manifestAsset.browser_download_url;

  if (process.env.DOWNLOADS_MANIFEST_URL?.trim()) {
    manifest.manifestUrl = process.env.DOWNLOADS_MANIFEST_URL.trim();
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`[release] downloads.json → ${manifest.manifestUrl}`);

  const gitlabToken = process.env.GITLAB_TOKEN?.trim() || process.env.CI_JOB_TOKEN;
  const projectId = process.env.CI_PROJECT_ID;
  const apiBase = process.env.CI_API_V4_URL ?? "https://gitlab.com/api/v4";

  if (gitlabToken && projectId) {
    const assetLinks = [
      { name: "downloads.json", url: manifest.manifestUrl },
      ...uploaded.map((a) => ({ name: a.name, url: a.browser_download_url })),
    ];
    await createGitLabRelease(gitlabToken, projectId, apiBase, tag, version, assetLinks);
  } else {
    log("[release] skipping GitLab release metadata (no CI_PROJECT_ID or token)");
  }

  log("[release] done");
  log(JSON.stringify({ version, tag, downloads, manifestUrl: manifest.manifestUrl }, null, 2));
}

main().catch((err) => fail(err.message));
