/**
 * Target environment. Defaults point at the public RealWorld demo;
 * override with env vars to run against a local or staging instance.
 */
export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://demo.realworld.show',
  apiUrl: process.env.API_URL ?? 'https://api.realworld.show/api',
} as const;
