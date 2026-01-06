import * as vscode from 'vscode';
import { getUri } from '../utils/index.js';

export class GitXViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gitx.view';

  constructor(private readonly ctx: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.ctx.extensionUri],
    };

    webview.html = getWebviewContent(this.ctx, webview);

    webview.onDidReceiveMessage((msg) => {
      switch (msg.command) {
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
