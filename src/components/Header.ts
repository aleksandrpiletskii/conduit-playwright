import { Locator, Page } from '@playwright/test';

/** Top navigation bar, shared by every page. */
export class Header {
  readonly root: Locator;
  readonly homeLink: Locator;
  readonly signInLink: Locator;
  readonly signUpLink: Locator;
  readonly newArticleLink: Locator;
  readonly settingsLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('nav.navbar');
    this.homeLink = this.root.getByRole('link', { name: 'Home' });
    this.signInLink = this.root.getByRole('link', { name: 'Sign in' });
    this.signUpLink = this.root.getByRole('link', { name: 'Sign up' });
    this.newArticleLink = this.root.getByRole('link', { name: 'New Article' });
    this.settingsLink = this.root.getByRole('link', { name: 'Settings' });
  }

  /** Profile link that appears once a user is signed in. */
  userLink(username: string): Locator {
    return this.root.getByRole('link', { name: username });
  }
}
