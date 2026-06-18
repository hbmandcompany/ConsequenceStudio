#!/usr/bin/env node

/**
 * Set GitLab CI/CD variables for release mirroring.
 * Requires a Hatedbymany GitLab token with `api` scope (git OAuth is not enough).
 *
 * Usage (PowerShell):
 *   $env:GITLAB_TOKEN = "glpat-..."
 *   $env:GITHUB_TOKEN = (gh auth token)
 *   node deploy/release/setup-gitlab-variables.mjs
 */

const GITLAB_HOST = "https://gitlab.com/api/v4";
const PROJECT = "consequencesoftware/studio";

const gitlabToken = process.env.GITLAB_TOKEN?.trim();
const githubToken = process.env.GITHUB_TOKEN?.trim();
const githubRepo = process.env.GITHUB_REPO?.trim() || "consequencesoftware/studio";

if (!gitlabToken) {
  console.error("GITLAB_TOKEN is required (Hatedbymany PAT with api scope).");
  process.exit(1);
}
if (!githubToken) {
  console.error("GITHUB_TOKEN is required (GitHub PAT with repo contents write).");
  process.exit(1);
}

async function gl(method, path, body) {
  const res = await fetch(`${GITLAB_HOST}${path}`, {
    method,
    headers: {
      "PRIVATE-TOKEN": gitlabToken,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return data;
}

const user = await gl("GET", "/user");
console.log(`GitLab: ${user.username} (${user.name})`);

const project = await gl("GET", `/projects/${encodeURIComponent(PROJECT)}`);
console.log(`Project: ${project.path_with_namespace} (id ${project.id})`);

let vars = await gl("GET", `/projects/${project.id}/variables`);

async function upsert(key, value, masked, protectedFlag) {
  const existing = vars.find((v) => v.key === key);
  if (existing) {
    await gl("PUT", `/projects/${project.id}/variables/${encodeURIComponent(key)}`, {
      value,
      masked,
      protected: protectedFlag,
    });
    console.log(`updated ${key}`);
  } else {
    await gl("POST", `/projects/${project.id}/variables`, {
      key,
      value,
      masked,
      protected: protectedFlag,
    });
    console.log(`created ${key}`);
  }
}

await upsert("GITHUB_TOKEN", githubToken, true, true);
await upsert("GITHUB_REPO", githubRepo, false, false);

vars = await gl("GET", `/projects/${project.id}/variables`);
console.log(
  "CI variables:",
  vars.map((v) => `${v.key}${v.masked ? " (masked)" : ""}`).join(", "),
);
console.log("done");
