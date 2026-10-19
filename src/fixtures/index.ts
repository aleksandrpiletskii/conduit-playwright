import { test as base, expect } from '@playwright/test';
import { ConduitApi } from '../api/ConduitApi';
import type { Article, User } from '../api/types';
import { buildArticle, buildUser } from '../data/factories';
import { ArticlePage } from '../pages/ArticlePage';
import { EditorPage } from '../pages/EditorPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

/** A registered account plus the password, so UI tests can sign in with it. */
export interface AccountUser extends User {
  password: string;
}

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
      const credentials = buildUser();
      const user = await new ConduitApi(request).register(credentials);
      await use({ ...user, password: credentials.password });
      await request.dispose();
    },
    { scope: 'worker' },
  ],

  // ---- layer 2: API clients and seeded data --------------------------------
  api: async ({ request }, use) => {
    await use(new ConduitApi(request));
  },

  userApi: async ({ api, workerUser }, use) => {
    await use(api.as(workerUser.token));
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
