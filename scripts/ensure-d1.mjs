import { appendFileSync } from "node:fs";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
const databaseName = "enagram-platform-db";

if (!accountId || !apiToken) {
  console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.");
  process.exit(1);
}

const endpoint = "https://api.cloudflare.com/client/v4/accounts/" +
  encodeURIComponent(accountId) + "/d1/database";

async function api(method, body) {
  const response = await fetch(endpoint + "?name=" + encodeURIComponent(databaseName) + "&per_page=100", {
    method,
    headers: {
      Authorization: "Bearer " + apiToken,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Cloudflare API returned a non-JSON response (HTTP " + response.status + ").");
  }

  if (!response.ok || payload.success !== true) {
    const detail = Array.isArray(payload.errors)
      ? payload.errors.map((item) => item.message || String(item.code || "unknown error")).join("; ")
      : "HTTP " + response.status;
    throw new Error("Cloudflare D1 API request failed: " + detail);
  }
  return payload;
}

function findDatabase(payload) {
  const results = Array.isArray(payload.result) ? payload.result : [];
  return results.find((database) => database.name === databaseName && database.uuid);
}

async function main() {
  let database = findDatabase(await api("GET"));
  if (database) {
    console.log("Reusing existing D1 database: " + database.name);
  } else {
    console.log("D1 database not found. Creating " + databaseName + "...");
    try {
      const created = await api("POST", { name: databaseName });
      database = created.result;
    } catch (error) {
      // Handle concurrent first deployments safely by checking for a database
      // another workflow may have created between the list and create requests.
      const existing = findDatabase(await api("GET"));
      if (!existing) throw error;
      database = existing;
    }
  }

  if (!database?.uuid || database.name !== databaseName) {
    throw new Error("Cloudflare did not return the expected D1 database UUID.");
  }

  if (!process.env.GITHUB_ENV) {
    throw new Error("GITHUB_ENV is unavailable. Run this script inside GitHub Actions.");
  }
  appendFileSync(process.env.GITHUB_ENV, "CLOUDFLARE_D1_DATABASE_ID=" + database.uuid + "\n");
  console.log("D1 database ready. Its ID will be passed to the following workflow steps.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to ensure D1 database.");
  process.exit(1);
});
