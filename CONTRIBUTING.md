# Contributing to GitX

Thank you for contributing! This guide covers setup, dev workflow, and pre-flight checks.

## Prerequisites

- Node.js 24+
- pnpm
- VS Code ≥ 1.107 (matches `engines`)

## Setup

```bash
pnpm install
```

## Run the extension (with webview HMR)

1. Start the webview dev server (Vite):

```bash
cd src/webview
pnpm dev
```

2. Launch the extension (add env in launch.json or shell):

```jsonc
"env": { "GITX_DEV_SERVER_URL": "http://localhost:5173" }
```

3. In VS Code, run the command **GitX: Open Panel** (or click the GitX status bar item).

## Build webview assets (production path)

```bash
cd src/webview
pnpm build
```

Artifacts land in `src/webview/build/` and are loaded when `GITX_DEV_SERVER_URL` is not set.

## Before opening a PR

- Keep changes small and focused; add tests when possible.
- Run `pnpm run compile` and `pnpm run lint`.
- If UI changes affect production build, run `cd src/webview && pnpm build`.
- Update docs (README/DEVELOPMENT/CHANGELOG) when behavior or setup changes.

## Reporting issues

- Include VS Code version, OS, repro steps, and relevant logs from the Extension Host output.

## Project layout

- Extension entry: `src/extension.ts`
- Webview provider + HTML glue: `src/webview/index.ts`
- Built webview assets: `src/webview/build/` (Vite/Vue build output)
- Commands/views:
  - Commands: `gitx.openPanel`, `gitx.revealView`, `gitx.helloWorld`
  - Webview view id: `gitx.view` (container id: `gitxPanel`, shown in VS Code Panel)

## Troubleshooting

- If the webview shows 401 on assets, ensure `localResourceRoots` includes `src/webview/build` (already configured) and assets are present.
- If the view does not appear, run `GitX: Open Panel` or `GitX: Reveal Panel`; the view id is `gitx.view` inside the Panel container.

## Release checklist (manual)

- `pnpm run compile`
- `cd src/webview && pnpm build`
- Verify panel loads without `GITX_DEV_SERVER_URL`
- Update `CHANGELOG.md` if needed

Happy hacking! 🎉
