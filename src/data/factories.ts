import { randomUUID } from 'node:crypto';
import type { Article, NewArticle, NewUser } from '../api/types';

/** Short unique suffix: keeps parallel workers and reruns from colliding. */
export const uid = (): string => randomUUID().slice(0, 8);

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const id = uid();
  return {
    username: `qa_${id}`,
    email: `qa_${id}@example.test`,
    password: `Pw_${randomUUID()}`,
    ...overrides,
  };
}

export function buildArticle(overrides: Partial<NewArticle> = {}): NewArticle {
  const id = uid();
  return {
    title: `Test article ${id}`,
    description: `Description ${id}`,
    body: `Body of the test article ${id}.\n\nSecond paragraph.`,
    tagList: ['playwright', `tag-${id}`],
    ...overrides,
  };
}

/**
 * Full Article payload for stubbed responses. Values are fixed so that
 * stubbed UI tests render the same thing on every run.
 */
export function stubArticle(overrides: Partial<Article> = {}): Article {
  return {
    slug: 'stubbed-article',
    title: 'Stubbed article',
    description: 'Rendered from a deterministic stub',
    body: 'Stub body',
    tagList: ['stub', 'deterministic'],
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    favorited: false,
    favoritesCount: 7,
    author: { username: 'stub_author', bio: null, image: null, following: false },
    ...overrides,
  };
}
