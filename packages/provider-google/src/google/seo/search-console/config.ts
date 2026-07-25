export type GoogleSearchConsoleCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export function readGoogleSearchConsoleCredentials(
  env: Record<string, string | undefined>,
): GoogleSearchConsoleCredentials {
  const credentials = {
    clientId: env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID?.trim() ?? env.GOOGLE_OAUTH_CLIENT_ID?.trim(),
    clientSecret:
      env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET?.trim() ?? env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
    refreshToken:
      env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN?.trim() ?? env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim(),
  };
  const missing = [
    ['GOOGLE_SEARCH_CONSOLE_CLIENT_ID or GOOGLE_OAUTH_CLIENT_ID', credentials.clientId],
    ['GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET or GOOGLE_OAUTH_CLIENT_SECRET', credentials.clientSecret],
    ['GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN or GOOGLE_OAUTH_REFRESH_TOKEN', credentials.refreshToken],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Google Search Console env: ${missing.join(', ')}.`);
  }

  return credentials as GoogleSearchConsoleCredentials;
}
