# Deployment setup: where each value comes from

This is a click-by-click guide for the GitHub Actions deployment. **Never paste tokens or client secrets into chat, issues, source files, or commit history.** Put them directly into GitHub repository secrets.

## 1. Choose the production URL first

**You do not have to deploy the Worker first.** Cloudflare lets you configure your account's `workers.dev` subdomain before any Worker has been deployed. The app URL can therefore be determined in advance.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select the account you will deploy into, then open **Workers & Pages**.
3. Find **Your subdomain** and click **Change** (or enable/setup the `workers.dev` subdomain if prompted). Choose an available account subdomain and save it. Cloudflare's [official workers.dev instructions](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) document this setting.
4. Your account hostname will be `YOUR-SUBDOMAIN.workers.dev`. The Worker name in this repository's `wrangler.jsonc` is `enagram-platform`, so the app URL will be `https://enagram-platform.YOUR-SUBDOMAIN.workers.dev`.

For a no-custom-domain, Free-tier first deployment, use the Worker's `workers.dev` URL:

```text
https://enagram-platform.<YOUR_ACCOUNT_SUBDOMAIN>.workers.dev
```

The Worker name is `enagram-platform` (from `wrangler.jsonc`). Find or enable your account's `workers.dev` subdomain in the [Cloudflare dashboard](https://dash.cloudflare.com/) under **Workers & Pages** / account settings. The official [workers.dev guide](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) explains the hostname format. Replace the placeholder with the account subdomain you see in Cloudflare.

If using a custom domain instead, it must be a domain you control and configured for Cloudflare Workers. Set `APP_URL` to the exact HTTPS origin users will visit, without a trailing path (for example, `https://souls.example.com`).

You need this URL before configuring GitHub OAuth because the callback URL depends on it.

## 2. Create or configure the GitHub OAuth App

Open [GitHub Developer Settings](https://github.com/settings/developers), then choose **OAuth Apps** → **New OAuth App** (or select the app you already created).

Fill in:

- **Application name:** Enagram (or your preferred display name).
- **Homepage URL:** your chosen `APP_URL`.
- **Authorization callback URL:** `APP_URL/api/auth/github/callback` exactly.

For the `workers.dev` example above, the callback would be:

```text
https://enagram-platform.<YOUR_ACCOUNT_SUBDOMAIN>.workers.dev/api/auth/github/callback
```

After registering the app:

- **`ENAGRAM_GITHUB_CLIENT_ID`** — shown on the OAuth App's details page.
- **`ENAGRAM_GITHUB_CLIENT_SECRET`** — on the same page, select **Generate a new client secret**. GitHub treats this as confidential; store it directly in GitHub Secrets.

Do not use your GitHub personal access token here. This project uses an OAuth App client ID and client secret.

Official guide: [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

## 3. Find the Cloudflare account ID

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and select the account where the Worker will be deployed.
2. Go to **Workers & Pages** and look for **Account Details → Account ID**. Use **Copy**.
3. Alternatively, use Cloudflare's [official instructions for finding the Account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/).

Add this value as the GitHub secret `CLOUDFLARE_ACCOUNT_ID`. It is an account identifier, not an API token.

## 4. Create the Cloudflare API token

1. Open Cloudflare's [API Tokens page](https://dash.cloudflare.com/profile/api-tokens), or from the selected account open **Manage account → Account API tokens** if creating an account-owned token.
2. Create a token restricted to the Cloudflare account used for this project. An account-owned token is useful for automation that should not depend on a specific user's future account status; it may require account-admin/API-token provisioning rights.
3. Start with the official **Edit Cloudflare Workers** template, then add the D1 permission needed for automatic database creation.
4. Confirm the account-level permissions include:
   - **Workers Scripts Write** — upload/deploy the application Worker.
   - **D1 Write** — list/create the D1 database and manage migrations.
   Keep resource scope limited to the one Cloudflare account wherever the UI allows.
5. Create the token and copy it immediately; Cloudflare shows the token value only at creation time.

Add the copied value as the GitHub secret `CLOUDFLARE_API_TOKEN`.

References: [Cloudflare's GitHub Actions deployment guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/), [D1 create API permission](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/).

If your account does not show account-owned API tokens, use a user API token from the profile API Tokens page with the same minimum required account permissions. Never use the Global API Key for this workflow.

## 5. Add the values to this GitHub repository

Open the repository's [Actions secrets and variables settings](https://github.com/imanbarati/ubiquitous-rotary-phone/settings/secrets/actions).

Under **Repository secrets**, click **New repository secret** for each:

| Secret name | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token you create in Cloudflare step 4. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Workers & Pages → Account Details, step 3. |
| `ENAGRAM_GITHUB_CLIENT_SECRET` | Your GitHub OAuth App → Generate a new client secret, step 2. |

Then click the **Variables** tab on the same settings page and create these repository variables:

| Variable name | Value |
|---|---|
| `APP_URL` | The exact HTTPS origin chosen in step 1, without a path or trailing slash. |
| `ENAGRAM_GITHUB_CLIENT_ID` | Client ID shown on the GitHub OAuth App details page, step 2. |
| `CLOUDFLARE_DEPLOY_ENABLED` | Enter `true` only when all the values above are ready. |

GitHub documentation: [repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets) and [repository variables](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables).

## 6. What the workflow does automatically

You do **not** need to create the D1 database manually or add a database ID secret.

When deployment is enabled, the action:

1. Builds and typechecks the app.
2. Calls `scripts/ensure-d1.mjs`, which finds `enagram-platform-db` in the selected account or creates it if it is missing.
3. Passes the resulting database UUID to the later job steps without committing it.
4. Generates an ignored temporary Wrangler config.
5. Applies the SQL migrations.
6. Sets the GitHub OAuth client secret as a Worker secret.
7. Deploys the Worker.

## 7. First deployment checklist

- [ ] A `workers.dev` subdomain is enabled, or a custom production domain is ready.
- [ ] GitHub OAuth Homepage URL and callback URL exactly match the selected `APP_URL`.
- [ ] The three repository secrets are configured.
- [ ] The three repository variables are configured.
- [ ] Cloudflare token is scoped to the correct account and includes Workers Scripts Write + D1 Write.
- [ ] Set `CLOUDFLARE_DEPLOY_ENABLED` to `true`.
- [ ] Open [GitHub Actions runs](https://github.com/imanbarati/ubiquitous-rotary-phone/actions) and inspect the deployment result.

If a run fails, open that workflow run and inspect the first failed step. Common errors are an incorrect API token scope, mistyped Account ID, mismatched OAuth callback URL, or an `APP_URL` that is not HTTPS.
