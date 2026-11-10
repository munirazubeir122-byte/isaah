export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface Options {
  method?: string;
  body?: unknown;
  /** Send a file as-is instead of JSON. */
  raw?: Blob;
}

/** Calls the Worker at /api/<path>. Errors carry the server's message. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined || opts.raw ? 'POST' : 'GET');
  const res = await fetch(`/api/${path}`, {
    method,
    credentials: 'same-origin',
    headers: opts.raw ? { 'Content-Type': opts.raw.type || 'application/octet-stream' } : { 'Content-Type': 'application/json' },
    body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status}).`);
  return data as T;
}

export interface Me {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');
