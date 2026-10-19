import { buildArticle } from '../../src/data/factories';
import { expect, test } from '../../src/fixtures';

test.describe('Articles API', () => {
  test('creates an article that matches the contract and can be fetched by slug', async ({ userApi, workerUser }) => {
    const input = buildArticle();

    const created = await userApi.createArticle(input);
    try {
      expect(created).toMatchObject({
        title: input.title,
        description: input.description,
        body: input.body,
        favorited: false,
        favoritesCount: 0,
        author: { username: workerUser.username },
      });
      expect(created.tagList.slice().sort()).toEqual(input.tagList.slice().sort());

      // Read back: what the API stored is what it returned on create.
      expect(await userApi.getArticle(created.slug)).toMatchObject({
        slug: created.slug,
        title: input.title,
        body: input.body,
      });
    } finally {
      await userApi.deleteArticle(created.slug);
    }
  });

  test('rejects an article without a title', async ({ userApi }) => {
    const { title: _omitted, ...withoutTitle } = buildArticle();

    const res = await userApi.rawCreateArticle(withoutTitle);

    expect([400, 422]).toContain(res.status());
    expect((await res.json()).errors).toBeDefined();
  });

  test('requires authentication to create an article', async ({ api }) => {
    const res = await api.rawCreateArticle(buildArticle());

    expect(res.status()).toBe(401);
  });

  test('favoriting updates both the flag and the counter', async ({ userApi, article }) => {
    const favorited = await userApi.favorite(article.slug);

    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(article.favoritesCount + 1);
  });

  test('a deleted article is no longer available', async ({ userApi }) => {
    const created = await userApi.createArticle(buildArticle());

    const del = await userApi.rawDeleteArticle(created.slug);
    expect(del.ok()).toBe(true);

    const res = await userApi.rawGetArticle(created.slug);
    expect(res.status()).toBe(404);
  });
});
