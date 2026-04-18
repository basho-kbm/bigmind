#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function readEnvValue(name) {
  const envFiles = [path.join(repoRoot, ".env.local"), path.join(repoRoot, ".env")];

  for (const envFile of envFiles) {
    try {
      const content = readFileSync(envFile, "utf8");
      const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
      if (match?.[1]) {
        return match[1].trim();
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

const projectRef = process.env.SUPABASE_PROJECT_REF ?? readEnvValue("SUPABASE_PROJECT_REF");
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_REF.");
  process.exit(1);
}

if (!accessToken) {
  console.error("Missing SUPABASE_ACCESS_TOKEN.");
  console.error("Create one at https://supabase.com/dashboard/account/tokens and rerun.");
  process.exit(1);
}

const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const templatesDir = path.join(repoRoot, "supabase", "email-templates");
const confirmSignupTemplate = await readFile(
  path.join(templatesDir, "confirm-signup.html"),
  "utf8",
);
const magicLinkTemplate = await readFile(path.join(templatesDir, "magic-link.html"), "utf8");

async function apiRequest(method, body) {
  const response = await fetch(apiUrl, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`${method} ${apiUrl} failed with ${response.status}.`);
    console.error(text);
    process.exit(1);
  }

  return text ? JSON.parse(text) : null;
}

const currentConfig = await apiRequest("GET");
const backupDir = path.join(repoRoot, "tmp");
await mkdir(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDir, `supabase-auth-template-backup-${timestamp}.json`);
await writeFile(
  backupPath,
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      projectRef,
      mailer_subjects_confirmation: currentConfig?.mailer_subjects_confirmation ?? null,
      mailer_subjects_magic_link: currentConfig?.mailer_subjects_magic_link ?? null,
      mailer_templates_confirmation_content:
        currentConfig?.mailer_templates_confirmation_content ?? null,
      mailer_templates_magic_link_content:
        currentConfig?.mailer_templates_magic_link_content ?? null,
    },
    null,
    2,
  ) + "\n",
);

await apiRequest("PATCH", {
  mailer_templates_confirmation_content: confirmSignupTemplate,
  mailer_templates_magic_link_content: magicLinkTemplate,
});

console.log(`Updated Supabase auth email templates for ${projectRef}.`);
console.log(`Backup saved to ${backupPath}.`);
