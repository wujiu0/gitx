import { type LogOutputChannel, window } from 'vscode';

class Logger {
  private static _instance: Logger;
  private _outputChannel: LogOutputChannel;

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
    console.log(`[gitx] ${msg}`, ...args);
  }

  error(msg: string, ...args: any[]): void {
    this._outputChannel.error(msg);
    console.error(`[gitx] ${msg}`, ...args);
  }

  public show(): void {
    this._outputChannel.show();
  }
}

export const logger = Logger.getInstance();
