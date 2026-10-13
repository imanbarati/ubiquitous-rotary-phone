# Enagram Platform

A TanStack Start / React / TypeScript app for creating and sharing Enagram “Souls”, deployed as a single Cloudflare Worker with D1 storage.

## Included MVP

- GitHub OAuth login with `read:user` scope.
- Private-by-default Soul creation, listing, editing and deletion.
- Server-side owner checks on every private endpoint.
- Validated declarative JSON data (24 KiB maximum); never executes user code.
- A server-rendered Persian public catalogue at `/` and an English catalogue at `/en`; each filters sources by the selected language and the explicit public tag.
- A private Soul dashboard at `/dashboard`; public routes query normalized source rows only and never serialize private Soul metadata.
- Server-rendered, indexable source pages at `/s/:slug` and `/en/s/:slug`; canonical URLs and `hreflang` alternates are emitted where the source is marked bilingual.
- Dynamic `/sitemap.xml` and `/robots.txt`, route-level Open Graph/Twitter metadata, JSON-LD structured data, and an explicit noindex rule for the private dashboard and API responses.
- Lightweight staggered CSS animations for catalogue cards and source blocks, with keyboard focus states and `prefers-reduced-motion` support.
- D1 migrations, unit tests, GitHub CI and an opt-in Cloudflare deploy workflow.

Soul content is stored in D1, never in this public source repository. Public catalog visibility comes from each source record's exact `publication: "public"` tag; all missing or unknown values are private. Source data lives in the Soul JSON `sources` array and is mirrored transactionally into `soul_sources` for public queries. Only hashed random session tokens are stored, and GitHub access tokens are not persisted. This initial schema is deliberately flexible until the Claude-generated Enagram repositories under https://github.com/imanbarati have been inventoried.

## Local development

Needs Node.js 24+ (CI and deployment use Node 24 to avoid a known npm 10 dependency-resolver crash with Vitest 4).

1. Run `npm install`.
2. Copy `.dev.vars.example` to `.dev.vars` and add the GitHub OAuth App's client secret. PowerShell: `Copy-Item .dev.vars.example .dev.vars`.
3. Create an OAuth App at https://github.com/settings/developers with callback `http://localhost:3000/api/auth/github/callback`.
4. Edit `ENAGRAM_GITHUB_CLIENT_ID` in `wrangler.jsonc` for local use.
5. Run `npm run db:migrate:local`, then `npm run dev`.
6. Validate with `npm test` and `npm run build`.

## Production D1 and automated deployment

For a click-by-click guide showing exactly where to find each GitHub secret and variable, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The deployment workflow automatically checks for a D1 database named `enagram-platform-db`; it creates the database if missing and reuses it if it already exists. It passes the UUID to later steps for Wrangler config generation, migrations, and deployment. No database UUID secret and no manual database creation are needed.

The CI workflow tests and builds pushes to `main` and pull requests. Production deployment is disabled until the repository variable `CLOUDFLARE_DEPLOY_ENABLED` is set to the exact value `true`.

In GitHub **Settings → Secrets and variables → Actions**, add these repository **secrets**:

- `CLOUDFLARE_API_TOKEN` — least-privilege Cloudflare token with D1 Write (to list/create the database), Workers deployment, and D1 migration permissions.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID.
- `ENAGRAM_GITHUB_CLIENT_SECRET` — OAuth App secret.

Add these repository **variables**:

- `APP_URL` — production origin including HTTPS, for example `https://enagram.example.com`.
- `ENAGRAM_GITHUB_CLIENT_ID` — OAuth App client ID.
- `CLOUDFLARE_DEPLOY_ENABLED` — set to `true` when the configuration above is ready.

Set the OAuth App's callback URL to `APP_URL + /api/auth/github/callback` exactly. Configure the Worker domain/DNS in Cloudflare. When enabled, the action generates a Git-ignored temporary Wrangler config, applies remote D1 migrations, uploads the OAuth secret, and deploys on every push to `main`. The workflow can also be manually triggered from the Actions tab.

## Routes and architecture

- `/` Persian SSR catalogue (only explicitly public Persian/bilingual sources)
- `/en` English SSR catalogue (only explicitly public English/bilingual sources)
- `/s/:slug`, `/en/s/:slug` localized SSR public source pages
- `/sitemap.xml`, `/robots.txt` crawler discovery/configuration
- `/dashboard` private archive and Soul editor
- `/api/auth/github`, `/api/auth/github/callback` OAuth login
- `/api/auth/logout`, `/api/me` session
- `/api/souls`, `/api/souls/:id` private CRUD
- `/api/public/souls`, `/api/public/souls/:slug`, `/s/:slug` public-source catalogue and detail pages (source tag required)

`wrangler.jsonc` contains placeholders; `scripts/configure-cloudflare.mjs` updates the generated `dist/server/wrangler.json` with deployment environment values after the build. This keeps Wrangler pointed at the actual bundled Worker entry point and static assets. Workers for Platforms is a separately priced future upgrade, not part of the Free-tier MVP.

## Search indexing notes

The canonical origin is currently `https://enagram-platform.baratiiman3.workers.dev` and is centralized in `src/lib/seo.ts`; update that constant before switching the production hostname. The sitemap is generated from public source rows at request time and never includes private sources. Technical SEO improves crawlability but does not guarantee inclusion/rankings; add the live property to Google Search Console and Bing Webmaster Tools and submit `/sitemap.xml` after deploy. English detail routes are included only for sources whose language is `en` or `both`.

This is an initial MVP, not a completed security audit. Before broad public launch, reconcile the existing Enagram domain model, add rate limiting, account deletion/export, and API integration tests.
