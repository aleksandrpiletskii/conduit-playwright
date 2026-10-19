import { stubArticle } from '../../src/data/factories';
import { expect, test } from '../../src/fixtures';
import { stubArticles, stubTags } from '../../src/stubs/routes';

/**
 * The feed rendered from deterministic stubs: no dependency on live data,
 * so these tests give the same result on every run and in every shard.
 */
test.describe('Home feed (stubbed API)', () => {
  test('renders every article and tag returned by the API', async ({ page, home }) => {
    const articles = [
      stubArticle({ slug: 'first', title: 'First stubbed article', favoritesCount: 3, tagList: ['alpha', 'beta'] }),
      stubArticle({ slug: 'second', title: 'Second stubbed article', favoritesCount: 0, tagList: [] }),
    ];
    await stubArticles(page, articles);
    await stubTags(page, ['alpha', 'beta', 'gamma']);

    await home.goto();

    await expect(home.previews).toHaveCount(2);
    const first = home.previewByTitle('First stubbed article');
    await expect(first.description).toHaveText(articles[0].description);
    await expect(first.author).toHaveText(articles[0].author.username);
    expect(await first.favoritesCount()).toBe(3);
    expect(await first.tags.texts()).toEqual(['alpha', 'beta']);
    expect(await home.popularTags.texts()).toEqual(['alpha', 'beta', 'gamma']);
  });

  test('shows the empty state when there are no articles', async ({ page, home }) => {
    await stubArticles(page, []);
    await stubTags(page, []);

    await home.goto();

    await expect(home.emptyState).toBeVisible();
    await expect(home.previews).toHaveCount(0);
  });
});
