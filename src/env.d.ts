interface EnagramD1Statement {
  bind(...values: unknown[]): EnagramD1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
}
interface EnagramD1Result { success: boolean; meta?: unknown }
interface EnagramD1Database {
  prepare(query: string): EnagramD1Statement;
  batch(statements: EnagramD1Statement[]): Promise<EnagramD1Result[]>;
}
interface EnagramCloudflareEnv {
  DB: EnagramD1Database;
  APP_URL: string;
  ENAGRAM_GITHUB_CLIENT_ID: string;
  ENAGRAM_GITHUB_CLIENT_SECRET?: string;
}
declare module "cloudflare:workers" {
  export const env: EnagramCloudflareEnv;
}
