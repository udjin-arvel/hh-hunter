export const HH_API_HOST_PATTERN = /^https:\/\/api\.hh\.ru\//;
export const DEEPSEEK_API_HOST_PATTERN = /^https:\/\/api\.deepseek\.com\//;

export const REQUIRED_HOST_PERMISSIONS = [
  "https://api.hh.ru/*",
  "https://api.deepseek.com/*",
  "https://hh.ru/*",
  "https://*.hh.ru/*",
] as const;

export const OPTIONAL_HOST_PERMISSIONS = ["https://*/*", "http://*/*"] as const;

export function isAllowedRequiredFetchUrl(url: string): boolean {
  return HH_API_HOST_PATTERN.test(url) || DEEPSEEK_API_HOST_PATTERN.test(url);
}

export function isHttpOrHttpsUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
