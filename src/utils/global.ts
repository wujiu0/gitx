import { exec } from 'child_process';
import { promisify } from 'util';
import type { WorkspaceConfiguration } from 'vscode';
import { Uri, Webview, workspace } from 'vscode';

export const getUri = (webview: Webview, extensionUri: Uri, pathList: string[]) => {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
};

export const vscodeConfiguration = (): WorkspaceConfiguration => {
  return workspace.getConfiguration();
};

export const getWorkspaceFolder = () => {
  return workspace.workspaceFolders?.[0].uri.fsPath;
};

export const execAsync = promisify(exec);
