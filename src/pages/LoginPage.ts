import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.getByPlaceholder('Email');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Sign in' });
    this.errors = page.locator('.error-messages li');
  }

  async goto(): Promise<void> {
    await this.open('/login');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
