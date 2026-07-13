export const HH_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function getHhApiUserAgent(): string {
  const fromEnv = import.meta.env.WXT_HH_USER_AGENT?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  return "HH-Hunter/1.1.0 (chrome-extension)";
}

export function getHhApiHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": getHhApiUserAgent(),
    "Accept-Language": "ru-RU",
  };
}

export function getHhBrowserHeaders(): HeadersInit {
  return {
    Accept: "text/html,application/xhtml+xml",
    "User-Agent": HH_BROWSER_USER_AGENT,
    "Accept-Language": "ru-RU,ru;q=0.9",
  };
}
