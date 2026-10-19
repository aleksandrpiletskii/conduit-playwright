import { expect, test } from '../../src/fixtures';

test.describe('Sign in', () => {
  test('signs in through the form and shows the user in the header', async ({ loginPage, home, newAccount, page }) => {
    await loginPage.goto();

    await loginPage.signIn(newAccount.email, newAccount.password);

    await expect(page).toHaveURL('/');
    await expect(home.header.userLink(newAccount.username)).toBeVisible();
    await expect(home.header.signInLink).toBeHidden();
  });

  test('shows an error for invalid credentials and stays anonymous', async ({ loginPage, newAccount }) => {
    await loginPage.goto();

    await loginPage.signIn(newAccount.email, `${newAccount.password}-wrong`);

    await expect(loginPage.errors.first()).toBeVisible();
    await expect(loginPage.header.userLink(newAccount.username)).toBeHidden();
  });

  test('a session injected through the API token skips the login form', async ({ signedIn, home }) => {
    await home.goto();

    await expect(home.header.userLink(signedIn.username)).toBeVisible();
    await expect(home.header.newArticleLink).toBeVisible();
  });
});
