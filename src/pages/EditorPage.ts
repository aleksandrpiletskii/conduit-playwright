import { Locator, Page } from '@playwright/test';
import type { NewArticle } from '../api/types';
import { BasePage } from './BasePage';

export class EditorPage extends BasePage {
  readonly title: Locator;
  readonly description: Locator;
  readonly body: Locator;
  readonly tagInput: Locator;
  readonly publish: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByPlaceholder('Article Title');
    this.description = page.getByPlaceholder("What's this article about?");
    this.body = page.getByPlaceholder('Write your article (in markdown)');
    this.tagInput = page.getByPlaceholder('Enter tags');
    this.publish = page.getByRole('button', { name: 'Publish Article' });
    this.errors = page.locator('.error-messages li');
  }

  async goto(): Promise<void> {
    await this.open('/editor');
  }

  async fill(article: NewArticle): Promise<void> {
    await this.title.fill(article.title);
    await this.description.fill(article.description);
    await this.body.fill(article.body);
    for (const tag of article.tagList) {
      await this.tagInput.fill(tag);
      await this.tagInput.press('Enter');
    }
  }

  async publishArticle(article: NewArticle): Promise<void> {
    await this.fill(article);
    await this.publish.click();
  }
}
