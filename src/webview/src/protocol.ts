export interface WebviewRequest<T = unknown> {
  id: string;
  command: string;
  payload?: T;
}

export interface ExtensionResponse<T = unknown> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ExtensionPush<T = unknown> {
  event: string;
  data: T;
}
