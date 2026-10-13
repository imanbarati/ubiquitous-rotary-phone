import { readFileSync, writeFileSync } from "node:fs";

const required = ["CLOUDFLARE_D1_DATABASE_ID", "APP_URL", "ENAGRAM_GITHUB_CLIENT_ID"];
const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error("Missing deployment values: " + missing.join(", "));
  process.exit(1);
}

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID.trim();
if (!/^[0-9a-f-]{36}$/i.test(databaseId)) {
  console.error("CLOUDFLARE_D1_DATABASE_ID must be a UUID.");
  process.exit(1);
}

let appUrl;
try {
  appUrl = new URL(process.env.APP_URL.trim());
} catch {
  console.error("APP_URL must be an absolute URL.");
  process.exit(1);
}
if (appUrl.protocol !== "https:") {
  console.error("Production APP_URL must use HTTPS.");
  process.exit(1);
}

// The Cloudflare Vite plugin generates the real deployable Worker config in
// dist/server/wrangler.json. It points to the bundled server entry and includes
// the correct static-assets paths. Using a custom root-level Wrangler config
// bypasses that redirect and leaves main pointing at an unresolved package path.
const configPath = "dist/server/wrangler.json";
let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  console.error("Could not read the generated Cloudflare config at " + configPath + ". Run npm run build first.");
  process.exit(1);
}

if (!config || typeof config !== "object" || typeof config.main !== "string" || !config.main) {
  console.error("Generated Cloudflare config is missing a valid Worker main entry.");
  process.exit(1);
}

config.vars = config.vars && typeof config.vars === "object" ? config.vars : {};
config.vars.APP_URL = appUrl.origin;
config.vars.ENAGRAM_GITHUB_CLIENT_ID = process.env.ENAGRAM_GITHUB_CLIENT_ID.trim();

const d1 = Array.isArray(config.d1_databases)
  ? config.d1_databases.find((binding) =>
      binding.binding === "DB" || binding.database_name === "enagram-platform-db"
    )
  : undefined;
if (!d1) {
  console.error("Generated Cloudflare config does not contain the DB D1 binding. Check wrangler.jsonc.");
  process.exit(1);
}
d1.database_id = databaseId;

writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
console.log("Updated generated Worker config with APP_URL, OAuth client ID, and D1 database ID.");
console.log("Deploy config: " + configPath);
