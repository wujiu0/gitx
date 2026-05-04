import * as path from 'path';
import * as vscode from 'vscode';
import { type GitService } from '../core/gitService.js';
import { getUri } from '../utils/index.js';
import type { WebviewRequest } from '../protocol.js';

export class GitXViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gitx.view';

  private webview: vscode.Webview | null = null;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly gitService: GitService,
  ) {
    gitService.codeGitAPI.onDidOpenRepository(() => this.pushEvent('git.repoChanged', null));
    gitService.codeGitAPI.onDidCloseRepository(() => this.pushEvent('git.repoChanged', null));
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview;
    this.webview = webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.ctx.extensionUri],
    };

    webview.html = getWebviewContent(this.ctx, webview);

    webview.onDidReceiveMessage(async (msg: WebviewRequest) => {
      const { id, command, payload } = msg;

      if (command === 'git.openDiff') {
        await this.handleOpenDiff(payload as any);
        return;
      }

      const activeRepoPath = this.getActiveRepoPath();

      try {
        const data = await this.dispatch(command, payload, activeRepoPath);
        webview.postMessage({ id, ok: true, data });
      } catch (err) {
        webview.postMessage({ id, ok: false, error: String(err) });
      }
    });
  }

  private getActiveRepoPath(): string {
    const repos = this.gitService.getRepos();
    return repos[0]?.path ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
  }

  private async dispatch(command: string, payload: any, repoPath: string): Promise<unknown> {
    switch (command) {
      case 'git.repos':
        return this.gitService.getRepos();
      case 'git.log':
        return this.gitService.getLog(repoPath, payload ?? {});
      case 'git.branches':
        return this.gitService.getBranches(repoPath);
      case 'git.commitDetail':
        return this.gitService.getCommitDetail(repoPath, payload.hash);
      case 'git.checkout':
        return this.gitService.checkoutBranch(repoPath, payload.name);
      case 'git.createBranch':
        return this.gitService.createBranch(repoPath, payload.name, payload.from);
      case 'git.deleteBranch':
        return this.gitService.deleteBranch(repoPath, payload.name, payload.force);
      case 'git.renameBranch':
        return this.gitService.renameBranch(repoPath, payload.oldName, payload.newName);
      case 'git.mergeBranch':
        return this.gitService.mergeBranch(repoPath, payload.name);
      case 'git.pushBranch':
        return this.gitService.pushBranch(repoPath, payload.branch, payload.remote);
      case 'git.createTag':
        return this.gitService.createTag(repoPath, payload.name, payload.hash);
      case 'git.fetch':
        return this.gitService.fetchAll(repoPath);
      case 'alert':
        vscode.window.showInformationMessage(payload?.text ?? '');
        return;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  private async handleOpenDiff(payload: {
    repoPath: string;
    filePath: string;
    originalPath?: string;
    hash: string;
    parentHash: string;
    status: string;
  }): Promise<void> {
    const { repoPath, filePath, originalPath, hash, parentHash, status } = payload;
    const gitApi = this.gitService.codeGitAPI;

    const fileAbsPath = path.join(repoPath, filePath);
    const fileUri = vscode.Uri.file(fileAbsPath);

    try {
      if (status === 'A') {
        const newUri = gitApi.toGitUri(fileUri, hash);
        await vscode.commands.executeCommand('vscode.open', newUri);
      } else if (status === 'D') {
        const oldUri = gitApi.toGitUri(fileUri, parentHash);
        await vscode.commands.executeCommand('vscode.open', oldUri);
      } else {
        const oldFilePath = originalPath ? path.join(repoPath, originalPath) : fileAbsPath;
        const oldUri = gitApi.toGitUri(vscode.Uri.file(oldFilePath), parentHash);
        const newUri = gitApi.toGitUri(fileUri, hash);
        const title = `${path.basename(filePath)}: ${parentHash.slice(0, 7)} ↔ ${hash.slice(0, 7)}`;
        await vscode.commands.executeCommand('vscode.diff', oldUri, newUri, title);
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to open diff: ${err}`);
    }
  }

  private pushEvent(event: string, data: unknown): void {
    this.webview?.postMessage({ event, data });
  }
}

function getWebviewContent(ctx: vscode.ExtensionContext, webview: vscode.Webview): string {
  const stylesUri = getUri(webview, ctx.extensionUri, ['src', 'webview', 'build', 'assets', 'index.css']);
  const scriptUri = getUri(webview, ctx.extensionUri, ['src', 'webview', 'build', 'assets', 'index.js']);
  const devUrl = process.env.GITX_DEV_SERVER_URL;

  if (devUrl) {
    return `<!DOCTYPE html>
<html lang="">
<head>
  <meta charset="UTF-8">
  <link href="/favicon.ico" rel="icon">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} https: http: data:; style-src ${webview.cspSource} 'unsafe-inline' http: https:;
             script-src ${webview.cspSource} http: https: 'unsafe-eval';
             connect-src ws: http: https:;">
  <title>gitx</title>
  <script type="module" src="${devUrl}/@vite/client"></script>
  <script type="module" src="${devUrl}/src/main.ts"></script>
</head>
<body>
<div id="app-gitx"></div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="">
<head>
  <meta charset="UTF-8">
  <link href="/favicon.ico" rel="icon">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>gitx</title>
  <script type="module" crossorigin src="${scriptUri}"></script>
  <link rel="stylesheet" crossorigin href="${stylesUri}">
</head>
<body>
<div id="app-gitx"></div>
</body>
</html>`;
}
