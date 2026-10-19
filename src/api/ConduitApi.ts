import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { env } from '../config/env';
import type { Article, ArticlesResponse, NewArticle, NewUser, User } from './types';

/**
 * Thin typed client over the RealWorld REST API.
 *
 * `raw*` methods return the APIResponse so negative tests can assert on
 * status codes and error bodies; the plain methods assert success and
 * return parsed data, which keeps setup code in fixtures short.
 */
export class ConduitApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  /** Returns a client that sends `Authorization: Token <token>`. */
  as(token: string): ConduitApi {
    return new ConduitApi(this.request, token);
  }

  private headers(): Record<string, string> {
    return this.token ? { Authorization: `Token ${this.token}` } : {};
  }

  private url(path: string): string {
    return `${env.apiUrl}${path}`;
  }

  // ---- users ---------------------------------------------------------------

  rawRegister(user: NewUser): Promise<APIResponse> {
    return this.request.post(this.url('/users'), { data: { user } });
  }

  async register(user: NewUser): Promise<User> {
    const res = await this.rawRegister(user);
    await expectOk(res, 'register user');
    return (await res.json()).user;
  }

  rawLogin(email: string, password: string): Promise<APIResponse> {
    return this.request.post(this.url('/users/login'), { data: { user: { email, password } } });
  }

  async login(email: string, password: string): Promise<User> {
    const res = await this.rawLogin(email, password);
    await expectOk(res, 'login');
    return (await res.json()).user;
  }

  async currentUser(): Promise<User> {
    const res = await this.request.get(this.url('/user'), { headers: this.headers() });
    await expectOk(res, 'get current user');
    return (await res.json()).user;
  }

  // ---- articles ------------------------------------------------------------

  rawCreateArticle(article: Partial<NewArticle>): Promise<APIResponse> {
    return this.request.post(this.url('/articles'), {
      data: { article },
      headers: this.headers(),
    });
  }

  async createArticle(article: NewArticle): Promise<Article> {
    const res = await this.rawCreateArticle(article);
    await expectOk(res, 'create article');
    return (await res.json()).article;
  }

  rawGetArticle(slug: string): Promise<APIResponse> {
    return this.request.get(this.url(`/articles/${slug}`), { headers: this.headers() });
  }

  async getArticle(slug: string): Promise<Article> {
    const res = await this.rawGetArticle(slug);
    await expectOk(res, `get article ${slug}`);
    return (await res.json()).article;
  }

  async listArticles(params: { author?: string; tag?: string; limit?: number } = {}): Promise<ArticlesResponse> {
    const res = await this.request.get(this.url('/articles'), {
      params: params as Record<string, string | number>,
      headers: this.headers(),
    });
    await expectOk(res, 'list articles');
    return res.json();
  }

  async favorite(slug: string): Promise<Article> {
    const res = await this.request.post(this.url(`/articles/${slug}/favorite`), { headers: this.headers() });
    await expectOk(res, `favorite ${slug}`);
    return (await res.json()).article;
  }

  rawDeleteArticle(slug: string): Promise<APIResponse> {
    return this.request.delete(this.url(`/articles/${slug}`), { headers: this.headers() });
  }

  /** Cleanup helper: tolerates an article that a test already deleted. */
  async deleteArticle(slug: string): Promise<void> {
    const res = await this.rawDeleteArticle(slug);
    expect([200, 204, 404], `delete article ${slug}`).toContain(res.status());
  }
}

async function expectOk(res: APIResponse, action: string): Promise<void> {
  if (!res.ok()) {
    throw new Error(`${action} failed: ${res.status()} ${res.statusText()}\n${await res.text()}`);
  }
}
