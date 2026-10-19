import { Locator, Page } from '@playwright/test';
import { ArticlePreview } from '../components/ArticlePreview';
import { TagList } from '../components/TagList';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  /** Only real cards: the empty-state message is rendered without a title. */
  readonly previews: Locator;
  readonly emptyState: Locator;
  readonly popularTags: TagList;

  constructor(page: Page) {
    super(page);
    this.previews = page.locator('.article-preview').filter({ has: page.locator('.preview-link h1') });
    this.emptyState = page.getByText('No articles are here... yet.');
    this.popularTags = new TagList(page.locator('.sidebar .tag-list'));
  }

  async goto(): Promise<void> {
    await this.open('/');
  }

  preview(index: number): ArticlePreview {
    return new ArticlePreview(this.previews.nth(index));
  }

  previewByTitle(title: string): ArticlePreview {
    return new ArticlePreview(this.previews.filter({ hasText: title }));
  }
}
