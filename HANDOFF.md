# Current implementation status — 2026-10-13

## Automatic database provisioning

The GitHub Actions deploy workflow now calls `scripts/ensure-d1.mjs` before Wrangler configuration. It uses the Cloudflare API to find `enagram-platform-db` by name, creates it if missing, and passes the returned UUID to subsequent steps through `GITHUB_ENV`. Repeated deploys reuse the same database. `CLOUDFLARE_D1_DATABASE_ID` is no longer a required GitHub secret.

The detailed, click-by-click setup guide is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md); it links to the exact Cloudflare and GitHub pages for each required value.

Required setup remains: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GITHUB_CLIENT_SECRET`, `APP_URL`, and `GITHUB_CLIENT_ID`, plus `CLOUDFLARE_DEPLOY_ENABLED=true`. The API token must include D1 Write, Workers deployment, and D1 migration permissions.

**Verification note:** this change is committed, but the GitHub Actions runner has not yet been observed completing the job. Do not claim a successful live deployment until Actions confirms it.

---

# Current implementation status — 2026-10-13

The MVP scaffold and workflows have now been committed to this repository. See README.md for setup.

Implemented in the source tree:
- TanStack Start + React/TypeScript app and Cloudflare Vite/Wrangler configuration.
- GitHub OAuth login with state-cookie validation and opaque, D1-backed sessions.
- D1 schema/migration for users, sessions, and Souls.
- Private-by-default Soul create/list/read/update/delete API endpoints with owner-scoped database queries.
- Validated JSON input, explicit public/unlisted sharing, dashboard/editor, and share page.
- Unit tests, CI workflow, deploy workflow, and a script that writes an ignored deployment config without committing secrets.

Deployment is intentionally gated by the GitHub Actions repository variable CLOUDFLARE_DEPLOY_ENABLED=true. Required Cloudflare and GitHub OAuth configuration is documented in README.md.

**Verification caveat:** the commit has been pushed, but this assistant could not run npm install/build inside its environment or confirm a successful Actions run/live Cloudflare deployment. Treat CI as pending until the repository's Actions tab reports success. Also inspect existing Enagram repositories under imanbarati and reconcile their exact domain schema before calling this production-ready.

## Current next steps

1. Check the CI workflow run and correct any dependency/type/build errors it reports.
2. Create the production D1 database and configure GitHub Actions secrets/variables using README.md.
3. Set the OAuth callback URL exactly to APP_URL + /api/auth/github/callback.
4. Enable CLOUDFLARE_DEPLOY_ENABLED only after configuration is complete.
5. Audit authorization, abuse controls, account deletion/export, and schema compatibility before public launch.

---

# HANDOFF — Enagram / Soul Platform on TanStack Start + Cloudflare

**Purpose:** Read this document before coding. It records the goal, constraints, architecture, and next steps. It is a specification, not a claim that the application is already complete.

## Product vision

Build an independent Enagram platform under [imanbarati](https://github.com/imanbarati), reusing work that Claude previously created in the owner's existing Enagram repositories.

Users should be able to create, save, edit, preview, and eventually publish their own “Souls” / Enagram experiences through a simple web interface. Treat “Soul” as the product's content concept; inspect the existing repositories to recover the real schema instead of inventing one.

Technology target: TanStack Start + TypeScript on Cloudflare Workers, with a Free-tier-first MVP and private-by-default storage.

Reference templates:
- https://workers.new/templates/multiplayer-globe-template
- https://workers.new/templates/llm-chat-app-template
- https://workers.new/templates/workers-for-platforms-template

Use these as inspiration, not as a requirement to copy them. The three URLs were originally pasted together; they are separate intended links.

## Important constraints

1. **Free-tier first.** Do not introduce paid Cloudflare products, paid APIs, or mandatory subscriptions without clearly identifying the cost.
2. **Workers for Platforms is paid.** Do not promise that per-user isolated Worker deployments work on the ordinary Workers Free plan. The MVP must run on ordinary Workers and leave a provider boundary for a future Workers for Platforms upgrade.
3. **Never run user-supplied JavaScript** inside the app Worker. Store validated, declarative Enagram/Soul data and render it safely. Arbitrary code execution requires a separate isolation and security design.
4. **Privacy by default.** Never commit user content, OAuth tokens, GitHub tokens, Cloudflare API tokens, or personal data to this public repository. No GitHub token in browser code or VITE_ variables.
5. GitHub is the source-control platform. If GitHub is also used for user-data storage, store that data in a **private repository**, using a server-side GitHub App or fine-grained token with minimum permissions. Do not use public issues/comments as a database.
6. Never claim code was pushed, tests passed, or deployment completed unless verified.

## Architecture for the Free-tier MVP

- TanStack Start + TypeScript; use the currently supported Cloudflare adapter/config and verify package versions against the current official guide.
- Responsive dashboard with create/edit/preview/delete flows.
- Server-side validation and authorization on every read/write.
- Initial Soul fields: stable ID/slug, owner ID, title, optional description, schema-versioned Enagram data, visibility (private by default), and timestamps. Recover/align the schema with existing repos first.
- Suggested default storage: Cloudflare D1 for records and ownership checks. Keep storage behind an interface. Add optional private-GitHub JSON storage only where specifically needed.
- Publish the MVP as data rendered by the same app, e.g. `/s/:slug`. This is not a separate Worker per Soul.
- Future paid extension: implement a DeploymentProvider for Workers for Platforms dispatch namespaces and per-user Workers. Do not make it required to run the MVP.

## Existing work and repository strategy

Target account: https://github.com/imanbarati

The owner says Claude has already created Enagram-related repositories. **Inventory them before rebuilding.** Read their README files, package manifests, schema/data models, licenses, and recent commits. Reuse relevant code and preserve history. Do not assume repository names or overwrite existing work.

This repository should become the dedicated Enagram platform repository. Keep:
- this `HANDOFF.md`
- `README.md` with clean-checkout setup and deployment instructions
- TanStack Start application, tests, and schema
- `wrangler.jsonc` with placeholder bindings only
- `.dev.vars.example` without secrets
- `.gitignore` excluding local env files and build output
- GitHub Actions for install, lint/typecheck, tests, and build
- concise privacy/security documentation

## Build order

1. **Inventory existing work first.** Find Enagram-related repositories and report framework, features, license, schemas, recent activity, and reuse candidates.
2. Recover the Soul/Enagram domain schema and write a compatibility note.
3. Scaffold a minimal TanStack Start app with TypeScript, tests, lint/typecheck, and Cloudflare config.
4. Implement secure identity/session handling, then private dashboard CRUD, preview, visibility rules, and data export.
5. Add D1 migrations and repository/storage interfaces. Add GitHub-private storage only when the owner explicitly selects it.
6. Add Wrangler local-dev, migration, and deploy instructions. Do not invent account IDs, binding IDs, domains, or secrets.
7. Add CI. Deployment must require configured secrets and must not expose credentials to untrusted PR code.
8. Run actual checks, fix failures, and record commands/results. Test cross-user access denial and anonymous access to private Souls.
9. Deploy only after the owner configures Cloudflare bindings/secrets. Never ask the owner to paste tokens in chat.

## Security and privacy checklist

- [ ] New Souls are private by default; public/unlisted sharing is opt-in and revocable.
- [ ] Every read/write checks the authenticated session and authorization server-side.
- [ ] Never trust a client-supplied ownerId.
- [ ] Validate schema, size, slug uniqueness, field types, and visibility on the server.
- [ ] Safely escape/render user content; no eval, new Function, or user JavaScript.
- [ ] No secrets in the repo, browser bundles, logs, or error responses.
- [ ] GitHub content storage (if enabled) uses a private repo and minimum token permissions.
- [ ] Add abuse/rate limits, export, and deletion paths.
- [ ] Tests cover cross-user denial and private content not being served anonymously.

## UX direction

Build a polished, minimal interface—not a raw admin template. The template references suggest optional ideas:
- Multiplayer Globe: live collaborative visualization only if it suits the Enagram experience.
- LLM Chat: conversational creation only if useful; any model provider must be optional and disclose possible cost.
- Workers for Platforms: future isolation/deployment layer, not a Free-tier dependency.

Do not add a globe, chat UI, or AI provider merely because a template was linked. Prioritize a reliable creation and privacy workflow.

## Acceptance criteria

- A developer or AI can follow README instructions from a clean checkout.
- The app runs locally and builds for Cloudflare Workers.
- Users can create, edit, preview, and delete Souls.
- Private Souls cannot be read by another user or anonymous visitors.
- Visibility and sharing behave as documented.
- Inputs are validated; arbitrary user code is never executed.
- No credentials are committed.
- CI passes, and exact check results are recorded.
- Docs clearly distinguish Free-tier features from paid Workers for Platforms features.

## Official references

- Workers for Platforms overview: https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/
- Workers for Platforms architecture: https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/how-workers-for-platforms-works/
- Workers for Platforms getting started: https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/get-started/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- TanStack Start on Cloudflare: https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/

## First instruction to the next AI

Start by inspecting existing Enagram-related repositories under `imanbarati`. Summarize their schema, framework, features, license, and reuse candidates, then implement the smallest secure MVP using the existing domain model. Preserve work, keep user data private, and do not deploy until the owner configures the Cloudflare environment.
