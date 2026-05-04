# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

讲中文

## Commands

- **Build Extension**: `pnpm compile`
- **Watch Extension**: `pnpm watch`
- **Typecheck**: `pnpm typecheck`
- **Lint**: `pnpm lint`
- **Run Tests**: `pnpm test` (requires VS Code environment)
- **Webview Development**: `cd src/webview && pnpm dev` (runs Vite dev server)
- **Webview Build**: `cd src/webview && pnpm build` (outputs to `src/webview/build`)
- **Package Extension**: `pnpm package` (creates .vsix file)

## Development

### Webview HMR

To enable Hot Module Replacement for the webview during development:

1. Start the webview dev server: `cd src/webview && pnpm dev`
2. Set the environment variable `GITX_DEV_SERVER_URL` to `http://localhost:5173` when launching the extension.

## Architecture

This is a Visual Studio Code extension that provides a JetBrains-style Git experience using a Webview.

### Extension Core (`src/`)

- `src/extension.ts`: The main entry point for the VS Code extension. Handles activation and registration of commands and views.
- `src/core/gitService.ts`: Encapsulates Git operations and interactions with the VS Code Git extension.
- `src/utils/`: Contains utility functions for logging, output channels, and global state management.
- `src/types.ts`: Shared TypeScript types for the extension.

### Webview UI (`src/webview/`)

- The UI is built with **Vue 3** and **Vite**.
- `src/webview/src/main.ts`: Entry point for the Vue application.
- `src/webview/src/components/`: Contains Vue components organized by view:
  - `LogView/`: The commit history log.
  - `BranchView/`: Branch management.
  - `DetailView/`: Commit details and file lists.
  - `public/`: Shared UI components like icons and containers.
- Communication between the extension and webview happens via `postMessage`.

### Build & Configuration

- **Extension**: Uses `tsdown` (configured in `tsdown.config.ts`) to bundle the TypeScript code into `out/`.
- **Webview**: Uses `vite` (configured in `src/webview/vite.config.ts`) to build the Vue app.
- **Package Manager**: `pnpm` is used for managing dependencies and workspace.
