import * as vscode from 'vscode';
import { type GitService } from '../core/gitService.js';
import { getUri } from '../utils/index.js';

export class GitXViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gitx.view';

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly gitService: GitService,
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.ctx.extensionUri],
    };

    webview.html = getWebviewContent(this.ctx, webview);

    webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        // case 'getLog': {
        //   try {
        //     const log = await this.gitService.getLog();
        //     webview.postMessage({ command: 'logData', data: log });
        //   } catch (err) {
        //     vscode.window.showErrorMessage(`Failed to get log: ${err}`);
        //   }
        //   break;
        // }
        // case 'getBranches': {
        //   try {
        //     const branches = await this.gitService.getBranches();
        //     webview.postMessage({ command: 'branchesData', data: branches });
        //   } catch (err) {
        //     vscode.window.showErrorMessage(`Failed to get branches: ${err}`);
        //   }
        //   break;
        // }
        // case 'getCommitFiles': {
        //   try {
        //     const files = await this.gitService.getCommitFiles(msg.hash);
        //     webview.postMessage({ command: 'commitFilesData', hash: msg.hash, data: files });
        //   } catch (err) {
        //     vscode.window.showErrorMessage(`Failed to get commit files: ${err}`);
        //   }
        //   break;
        // }
        case 'alert':
          vscode.window.showInformationMessage(msg.text);
          return;
      }
    });
  }
}

function getWebviewContent(ctx: vscode.ExtensionContext, webview: vscode.Webview): string {
  const stylesUri = getUri(webview, ctx.extensionUri, ['src', 'webview', 'build', 'assets', 'index.css']);
  // The JS file from the Vue build output
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
</html>
`;
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
</html>
`;
}
