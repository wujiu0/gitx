import * as vscode from 'vscode';
import { GitXViewProvider } from './webview/index.js';
export function activate(context: vscode.ExtensionContext) {
  console.log('[gitx] "gitx" is active!');

  const hello = vscode.commands.registerCommand('gitx.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from gitx!');
  });

  const openPanel = vscode.commands.registerCommand('gitx.openPanel', async () => {
    await vscode.commands.executeCommand('gitx.view.focus');
  });

  const providerRegistration = vscode.window.registerWebviewViewProvider(
    GitXViewProvider.viewType,
    new GitXViewProvider(context),
  );

  // Status bar item to open the GitX panel
  const sb = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  sb.text = '$(git-branch) GitX';
  sb.command = 'gitx.openPanel';
  sb.tooltip = 'Open GitX panel';
  sb.show();

  context.subscriptions.push(hello, openPanel, sb, providerRegistration);
}

export function deactivate() {}
