import type { ExtensionResponse, ExtensionPush } from '../protocol.js';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

// acquireVsCodeApi() can only be called once per webview lifetime
const vscodeApi = (typeof acquireVsCodeApi !== 'undefined') ? acquireVsCodeApi() : null;

const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
const pushListeners = new Map<string, Set<(data: unknown) => void>>();

window.addEventListener('message', (event: MessageEvent) => {
  const msg = event.data as ExtensionResponse | ExtensionPush;

  if ('id' in msg) {
    const entry = pending.get(msg.id);
    if (entry) {
      pending.delete(msg.id);
      if (msg.ok) {
        entry.resolve(msg.data);
      } else {
        entry.reject(new Error(msg.error ?? 'Unknown error'));
      }
    }
  } else if ('event' in msg) {
    const listeners = pushListeners.get(msg.event);
    if (listeners) {
      for (const fn of listeners) fn(msg.data);
    }
  }
});

export function request<T>(command: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    vscodeApi?.postMessage({ id, command, payload });
  });
}

export function onPushEvent<T>(event: string, callback: (data: T) => void): () => void {
  if (!pushListeners.has(event)) {
    pushListeners.set(event, new Set());
  }
  const cb = callback as (data: unknown) => void;
  pushListeners.get(event)!.add(cb);
  return () => pushListeners.get(event)?.delete(cb);
}
