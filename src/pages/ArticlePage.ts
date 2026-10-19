import { Locator, Page } from '@playwright/test';
import { TagList } from '../components/TagList';
import { BasePage } from './BasePage';

export class ArticlePage extends BasePage {
  readonly title: Locator;
  readonly body: Locator;
  readonly tags: TagList;
  readonly author: Locator;
  /** The page renders article actions twice (banner and footer); the banner copy is enough. */
  readonly deleteButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('.banner h1');
    this.body = page.locator('.article-content');
    this.tags = new TagList(page.locator('.article-content .tag-list'));
    this.author = page.locator('.banner .author');
    this.deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    this.editButton = page.getByRole('link', { name: 'Edit Article' }).first();
  }

  async goto(slug: string): Promise<void> {
    await this.open(`/article/${slug}`);
  }

  /** Slug of the article currently open, taken from the URL. */
  slugFromUrl(): string {
    const match = new URL(this.page.url()).pathname.match(/^\/article\/(.+)$/);
    if (!match) throw new Error(`Not on an article page: ${this.page.url()}`);
    return decodeURIComponent(match[1]);
  }
}
