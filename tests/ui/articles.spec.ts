import { buildArticle } from '../../src/data/factories';
import { expect, test } from '../../src/fixtures';

test.describe('Articles', () => {
  test('publishes an article through the editor', async ({ signedIn, editor, articlePage, userApi }) => {
    const input = buildArticle();
    await editor.goto();

    await editor.publishArticle(input);

    await expect(articlePage.title).toHaveText(input.title);
    const slug = articlePage.slugFromUrl();
    try {
      await expect(articlePage.body).toContainText('Second paragraph.');
      await expect(articlePage.author).toHaveText(signedIn.username);
      expect((await articlePage.tags.texts()).sort()).toEqual(input.tagList.slice().sort());

      // The UI says it's published; the API must agree.
      expect(await userApi.getArticle(slug)).toMatchObject({ title: input.title, body: input.body });
    } finally {
      await userApi.deleteArticle(slug);
    }
  });

  // The demo backend sandboxes accounts: an article is visible only to its
  // author, so the page is opened in the author's session.
  test('renders an article seeded through the API', async ({ signedIn: _session, article, articlePage }) => {
    await articlePage.goto(article.slug);

    await expect(articlePage.title).toHaveText(article.title);
    await expect(articlePage.body).toContainText('Second paragraph.');
    expect((await articlePage.tags.texts()).sort()).toEqual(article.tagList.slice().sort());
  });

  test('the author can delete their article', async ({ signedIn, article, articlePage, userApi, page }) => {
    expect(article.author.username).toBe(signedIn.username);
    await articlePage.goto(article.slug);

    await articlePage.deleteButton.click();

    await expect(page).toHaveURL('/');
    await expect.poll(async () => (await userApi.rawGetArticle(article.slug)).status()).toBe(404);
  });
});
