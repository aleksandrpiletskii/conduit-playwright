import type { ArticlesResponse } from '../../src/api/types';
import { expect, test } from '../../src/fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { tamperArticles } from '../../src/stubs/routes';

/**
 * Data consistency between API and UI, plus a mutation check that proves
 * the assertion actually detects a wrong number.
 */

async function expectFeedMatchesApi(home: HomePage, apiFeed: ArticlesResponse): Promise<void> {
  await home.goto();
  await expect(home.previews.first()).toBeVisible();

  for (const article of apiFeed.articles.slice(0, 3)) {
    const preview = home.previewByTitle(article.title);
    expect(await preview.favoritesCount(), `favorites of "${article.title}"`).toBe(article.favoritesCount);
  }
}

test.describe('Feed vs API', () => {
  test('favorites counters in the feed match the API', async ({ api, home }) => {
    const apiFeed = await api.listArticles({ limit: 10 });
    test.skip(apiFeed.articles.length === 0, 'Global feed is empty on this environment');

    await expectFeedMatchesApi(home, apiFeed);
  });

  test('mutation check: a corrupted counter is caught', async ({ api, home, page }) => {
    // Expected to fail. If this test ever passes, the consistency check above
    // has stopped comparing real values and is green for the wrong reason.
    test.fail();

    const apiFeed = await api.listArticles({ limit: 10 });
    test.skip(apiFeed.articles.length === 0, 'Global feed is empty on this environment');

    await tamperArticles(page, (body) => ({
      ...body,
      articles: body.articles.map((a) => ({ ...a, favoritesCount: a.favoritesCount + 1 })),
    }));

    await expectFeedMatchesApi(home, apiFeed);
  });
});
