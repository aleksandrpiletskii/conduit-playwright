import { test as base, expect } from '@playwright/test';
import { AccountUser, createVerifiedAccount } from '../api/accounts';
import { ConduitApi } from '../api/ConduitApi';
import type { Article } from '../api/types';
import { buildArticle, buildUser } from '../data/factories';
import { ArticlePage } from '../pages/ArticlePage';
import { EditorPage } from '../pages/EditorPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

export type { AccountUser };

type WorkerFixtures = {
  /**
   * User pool: one account per worker, created through the API once and
   * reused by every test in that worker. Parallel workers never share an
   * account, so tests can't step on each other's data.
   */
  workerUser: AccountUser;
};

type TestFixtures = {
  /**
   * Requesting this fixture opens every page already signed in as the
   * worker's user. Tests that don't ask for it stay anonymous and never
   * touch the account API.
   */
  signedIn: AccountUser;
  /**
   * Throwaway account for tests that sign in with a password. Signing in
   * rotates the token on this backend, so such tests must never use the
   * shared worker account.
   */
  newAccount: AccountUser;
  /** Anonymous API client. */
  api: ConduitApi;
  /** API client authenticated as the worker's user. */
  userApi: ConduitApi;
  /** Article created through the API before the test and deleted after it. */
  article: Article;
  home: HomePage;
  loginPage: LoginPage;
  editor: EditorPage;
  articlePage: ArticlePage;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // ---- layer 1: accounts (worker scope) ------------------------------------
  workerUser: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext();
      const user = await createVerifiedAccount(new ConduitApi(request));
      await use(user);
      await request.dispose();
    },
    { scope: 'worker', timeout: 60_000 },
  ],

  // ---- layer 2: API clients and seeded data --------------------------------
  api: async ({ request }, use) => {
    await use(new ConduitApi(request));
  },

  newAccount: async ({ api }, use) => {
    const credentials = buildUser();
    const user = await api.register(credentials);
    await use({ ...user, password: credentials.password });
  },

  userApi: async ({ api, workerUser }, use) => {
    // workerUser doubles as the shared session: if the client signs in
    // again, workerUser.token is updated for every later test in the worker.
    await use(api.asAccount(workerUser));
  },

  article: async ({ userApi }, use) => {
    const article = await userApi.createArticle(buildArticle());
    await use(article);
    await userApi.deleteArticle(article.slug);
  },

  // ---- layer 3: browser state ----------------------------------------------
  signedIn: async ({ page, workerUser }, use) => {
    // Skip the login form: put the API token where the app looks for it
    // before any page script runs.
    await page.addInitScript((token) => window.localStorage.setItem('jwtToken', token), workerUser.token);
    await use(workerUser);
  },

  // ---- layer 4: page objects -----------------------------------------------
  home: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  editor: async ({ page }, use) => use(new EditorPage(page)),
  articlePage: async ({ page }, use) => use(new ArticlePage(page)),
});

export { expect };
