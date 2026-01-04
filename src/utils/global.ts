import type { WorkspaceConfiguration } from 'vscode';
import { Uri, Webview, workspace } from 'vscode';

export const getUri = (webview: Webview, extensionUri: Uri, pathList: string[]) => {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
};

export const vscodeConfiguration = (): WorkspaceConfiguration => {
  return workspace.getConfiguration();
};
