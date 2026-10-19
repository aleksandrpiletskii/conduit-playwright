import { Locator } from '@playwright/test';
import { TagList } from './TagList';

/** One card in an article feed. */
export class ArticlePreview {
  readonly title: Locator;
  readonly description: Locator;
  readonly author: Locator;
  readonly favoriteButton: Locator;
  readonly tags: TagList;

  constructor(readonly root: Locator) {
    this.title = root.locator('.preview-link h1');
    this.description = root.locator('.preview-link p');
    this.author = root.locator('.author');
    this.favoriteButton = root.locator('app-favorite-button button');
    this.tags = new TagList(root.locator('.tag-list'));
  }

  /** Favorites counter as a number, parsed from the heart button. */
  async favoritesCount(): Promise<number> {
    const text = await this.favoriteButton.innerText();
    const match = text.match(/\d+/);
    if (!match) throw new Error(`No favorites count in "${text}"`);
    return Number(match[0]);
  }
}
