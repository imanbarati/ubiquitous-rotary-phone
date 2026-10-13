export const SITE_ORIGIN = "https://enagram-platform.baratiiman3.workers.dev";
export const SITE_NAME = "Enagram";
export type Locale = "fa" | "en";
export function absoluteUrl(path: string) {
  return new URL(path.startsWith("/") ? path : "/" + path, SITE_ORIGIN).toString();
}
export function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
