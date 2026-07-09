# Trade Studio (public site + releases) — agent instructions

This is the **public website + release-distribution repo** for Trade Studio. The app source
lives in the private `moorejasper060-oss/trade-studio-app` repo — no bot logic here. Contents:
static HTML site (GitHub Pages, `CNAME` = tradestudio.digga.ai), GitHub Releases hosting the
installers, and two workflows.

## Maintainer-local note (Jasper's machines)

The living project state doc shared between coding agents is
`~/.claude/projects/-Users-jaspermoore/memory/trade-studio-state.md` — read it at session
start, update it in place at session end.

## Standing rules from Jasper

<!-- STANDING-RULES:START -->
- **Always commit AND push code changes automatically** — don't wait to be asked. Solo
  personal repos: commit straight to the default branch (no PR) unless told otherwise.
  (Exception: `daytrade-agent` opens DRAFT PRs with tests green first — see its `CLAUDE.md`.)
- ⛔ **No user-facing release until Jasper explicitly says he's happy** — don't build, sign,
  publish, or push anything that reaches end users or the auto-updater. Committing and pushing
  source is always fine and expected. Default to "not yet."
- **UI/visual changes: preview before ship.** Show a localhost preview (or hot-swap into the
  running app) with 2–3 real mockups and let Jasper pick/iterate BEFORE building. He reacts to
  pixels, not descriptions — always screenshot-verify your OWN render first.
- **Shared project memory is the source of truth.** The state docs under
  `~/.claude/projects/-Users-jaspermoore/memory/` are read AND written by BOTH Claude Code and
  Codex — read the relevant one at session start, update it in place at session end (absolute
  dates), and never create a rival state file. Treat unexpected edits there as the other
  agent's session notes, not corruption.
<!-- STANDING-RULES:END -->

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
