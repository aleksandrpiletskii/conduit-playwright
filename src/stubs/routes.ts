import { Page, Route } from '@playwright/test';
import type { Article, ArticlesResponse } from '../api/types';

/**
 * Network stubs for the browser. Matching is done on the URL pathname,
 * so query strings (limit, offset, tag) never break a stub.
 */

const path = (pathname: string) => (url: URL) => url.pathname === pathname;

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Global feed returns exactly these articles. */
export async function stubArticles(page: Page, articles: Article[]): Promise<void> {
  const body: ArticlesResponse = { articles, articlesCount: articles.length };
  await page.route(path('/api/articles'), (route) => json(route, body));
}

/** Popular tags sidebar returns exactly these tags. */
export async function stubTags(page: Page, tags: string[]): Promise<void> {
  await page.route(path('/api/tags'), (route) => json(route, { tags }));
}

/**
 * Passes the request to the real server, then lets the test rewrite the
 * response body. Used for mutation checks: corrupt the data on purpose and
 * prove the assertion notices.
 */
export async function tamperArticles(
  page: Page,
  mutate: (body: ArticlesResponse) => ArticlesResponse,
): Promise<void> {
  await page.route(path('/api/articles'), async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as ArticlesResponse;
    await route.fulfill({ response, json: mutate(body) });
  });
}
