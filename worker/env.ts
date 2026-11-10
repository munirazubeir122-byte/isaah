export interface Env {
  /** The built site in dist/ (Workers static assets). */
  ASSETS: Fetcher;
  /** Accounts, edited content, page counts (Cloudflare D1). */
  DB: D1Database;
  /** Uploaded audio and images (Workers KV). */
  MEDIA: KVNamespace;
  /** Secret mixed into every password hash. Set with `wrangler secret put PEPPER`. */
  PEPPER: string;
}
