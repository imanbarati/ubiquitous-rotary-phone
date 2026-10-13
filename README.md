# Enagram Platform

A TanStack Start / React / TypeScript app for creating and sharing Enagram “Souls”, deployed as a single Cloudflare Worker with D1 storage.

## Included MVP

- GitHub OAuth login with `read:user` scope.
- Private-by-default Soul creation, listing, editing and deletion.
- Server-side owner checks on every private endpoint.
- Validated declarative JSON data (24 KiB maximum); never executes user code.
- Optional unlisted/public links at `/s/:slug`; setting visibility back to private revokes the link.
- D1 migrations, unit tests, GitHub CI and an opt-in Cloudflare deploy workflow.

Soul content is stored in D1, never in this public source repository. Only hashed random session tokens are stored, and GitHub access tokens are not persisted. This initial schema is deliberately flexible until the Claude-generated Enagram repositories under https://github.com/imanbarati have been inventoried.

## Local development

Needs Node.js 22+.

1. Run `npm install`.
2. Copy `.dev.vars.example` to `.dev.vars` and add the GitHub OAuth App's client secret. PowerShell: `Copy-Item .dev.vars.example .dev.vars`.
3. Create an OAuth App at https://github.com/settings/developers with callback `http://localhost:3000/api/auth/github/callback`.
4. Edit `GITHUB_CLIENT_ID` in `wrangler.jsonc` for local use.
5. Run `npm run db:migrate:local`, then `npm run dev`.
6. Validate with `npm test` and `npm run build`.

## Production D1 and automated deployment

The deployment workflow automatically checks for a D1 database named `enagram-platform-db`; it creates the database if missing and reuses it if it already exists. It passes the UUID to later steps for Wrangler config generation, migrations, and deployment. No database UUID secret and no manual database creation are needed.

The CI workflow tests and builds pushes to `main` and pull requests. Production deployment is disabled until the repository variable `CLOUDFLARE_DEPLOY_ENABLED` is set to the exact value `true`.

In GitHub **Settings → Secrets and variables → Actions**, add these repository **secrets**:

- `CLOUDFLARE_API_TOKEN` — least-privilege Cloudflare token with D1 Write (to list/create the database), Workers deployment, and D1 migration permissions.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID.
- `GITHUB_CLIENT_SECRET` — OAuth App secret.

Add these repository **variables**:

- `APP_URL` — production origin including HTTPS, for example `https://enagram.example.com`.
- `GITHUB_CLIENT_ID` — OAuth App client ID.
- `CLOUDFLARE_DEPLOY_ENABLED` — set to `true` when the configuration above is ready.

Set the OAuth App's callback URL to `APP_URL + /api/auth/github/callback` exactly. Configure the Worker domain/DNS in Cloudflare. When enabled, the action generates a Git-ignored temporary Wrangler config, applies remote D1 migrations, uploads the OAuth secret, and deploys on every push to `main`. The workflow can also be manually triggered from the Actions tab.

## Routes and architecture

- `/` dashboard and Soul editor
- `/api/auth/github`, `/api/auth/github/callback` OAuth login
- `/api/auth/logout`, `/api/me` session
- `/api/souls`, `/api/souls/:id` private CRUD
- `/api/public/souls/:slug`, `/s/:slug` explicitly shared content

`wrangler.jsonc` contains placeholders; `scripts/configure-cloudflare.mjs` generates ignored `.wrangler.deploy.jsonc` from deployment environment values. Workers for Platforms is a separately priced future upgrade, not part of the Free-tier MVP.

This is an initial MVP, not a completed security audit. Before broad public launch, reconcile the existing Enagram domain model, add rate limiting, account deletion/export, and API integration tests.
