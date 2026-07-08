# Trade Studio (public site + releases) — agent instructions

This is the **public website + release-distribution repo** for Trade Studio. The app source
lives in the private `moorejasper060-oss/trade-studio-app` repo — no bot logic here. Contents:
static HTML site (GitHub Pages, `CNAME` = tradestudio.digga.ai), GitHub Releases hosting the
installers, and two workflows.

## Maintainer-local note (Jasper's machines)

The living project state doc shared between coding agents is
`~/.claude/projects/-Users-jaspermoore/memory/trade-studio-state.md` — read it at session
start, update it in place at session end. The private app repo's own `AGENTS.md` has the full
standing rules; they apply here too.

## How this repo works

- **Publishing the site = pushing to `main`** (classic Pages, no build step). The Pages build
  occasionally flakes ("Deployment failed, try again later") — force a fresh build with
  `gh api -X POST repos/moorejasper060-oss/trade-studio/pages/builds`.
- The site shows the current version by querying this repo's **GitHub Releases API** at
  runtime — version strings in the HTML are only fallbacks (`js-ver`); keep them bumped anyway.
- Workflows: `build-app-windows.yml` (manual `workflow_dispatch`; builds the Windows installer
  from the PRIVATE app repo via the `APP_REPO_TOKEN` secret — exists because this public repo
  has free unlimited Actions minutes) and `announce-release.yml` (posts to Discord
  #app-updates via `DISCORD_RELEASE_WEBHOOK` on `release: published`).

## Rules for releases published here

- Every release needs a plain-English **news entry** in `news.html` + the site version banner.
- **Verify every release**: curl each asset by its exact manifest name and read the live
  `latest.json` until 3 consecutive clean `verify=True` reads. An asset uploaded under the
  wrong filename 404s every in-app update (this happened once for 2 days).
- Release assets follow the signed manifest (`latest.json`, Ed25519) — never rename assets
  after upload without re-checking the manifest.

## Gotchas

- Don't remove/rename `CNAME` — it pins the custom domain.
- `reel.html` is a ~1.4MB single-file bundle with inlined assets — never read or rewrite it
  whole; patch it surgically (the extract/rebundle recipe is in the maintainer's memory notes).
- `impressum.html`/`terms.html` live ONLY here, not in the app repo's `website/` folder.
