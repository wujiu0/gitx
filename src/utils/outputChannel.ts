import { type LogOutputChannel, window } from 'vscode';

class Logger {
  private static _instance: Logger;
  private _outputChannel: LogOutputChannel;
  private _devModeEnabled: boolean = false;

  private constructor() {
    this._outputChannel = window.createOutputChannel('gitx', { log: true });
  }

  public static getInstance(): Logger {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  info(msg: string, ...args: any[]): void {
    this._outputChannel.info(`${msg}`);
    if (this._devModeEnabled) {
      console.log(`[gitx] ${msg}`, ...args);
    }
  }

  error(msg: string, ...args: any[]): void {
    this._outputChannel.error(msg);
    if (this._devModeEnabled) {
      console.error(`[gitx] ${msg}`, ...args);
    }
  }

  public show(): void {
    this._outputChannel.show();
  }

  public setDevModeEnabled(enabled: boolean): void {
    this._devModeEnabled = enabled;
  }
}

export const logger = Logger.getInstance();
