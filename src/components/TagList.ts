import { Locator } from '@playwright/test';

/** Pill-style tag list; used in previews, on the article page and in the sidebar. */
export class TagList {
  readonly items: Locator;

  constructor(readonly root: Locator) {
    this.items = root.locator('.tag-default');
  }

  async texts(): Promise<string[]> {
    return (await this.items.allInnerTexts()).map((t) => t.trim());
  }
}
