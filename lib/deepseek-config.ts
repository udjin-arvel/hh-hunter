export function getDeepSeekApiKey(): string {
  const apiKey = import.meta.env.WXT_DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "WXT_DEEPSEEK_API_KEY is not set. Copy .env.example to .env and add your DeepSeek API key.",
    );
  }

  return apiKey;
}
