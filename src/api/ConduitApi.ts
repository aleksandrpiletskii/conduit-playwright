import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { env } from '../config/env';
import type { Article, ArticlesResponse, NewArticle, NewUser, User } from './types';

/**
 * Auth state shared by every client made for the same account. It is
 * mutable on purpose: when the client signs in again, the new token is
 * visible to everyone holding the session.
 */
export interface Session {
  token: string;
  email?: string;
  password?: string;
}

/**
 * Thin typed client over the RealWorld REST API.
 *
 * `raw*` methods return the APIResponse so negative tests can assert on
 * status codes and error bodies; the plain methods assert success and
 * return parsed data, which keeps setup code in fixtures short.
 *
 * Authenticated calls recover from a dropped session: on 401 the client
 * signs in again with the stored credentials and repeats the request once.
 * The public demo backend invalidates tokens unpredictably, and without
 * this the failures land in setup and teardown rather than in what a test
 * actually checks.
 */
export class ConduitApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly session?: Session,
  ) {}

  /** Client that sends `Authorization: Token <token>`, without recovery. */
  as(token: string): ConduitApi {
    return new ConduitApi(this.request, { token });
  }

  /** Client for an account whose credentials are known, with recovery. */
  asAccount(session: Session): ConduitApi {
    return new ConduitApi(this.request, session);
  }

  private headers(): Record<string, string> {
    return this.session ? { Authorization: `Token ${this.session.token}` } : {};
  }

  private url(path: string): string {
    return `${env.apiUrl}${path}`;
  }

  private async authed(send: (headers: Record<string, string>) => Promise<APIResponse>): Promise<APIResponse> {
    const res = await send(this.headers());
    const { session } = this;
    if (res.status() !== 401 || !session?.email || !session.password) return res;

    const login = await this.rawLogin(session.email, session.password);
    if (!login.ok()) return res;
    session.token = (await login.json()).user.token;
    return send(this.headers());
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
    const res = await this.authed((headers) => this.request.get(this.url('/user'), { headers }));
    await expectOk(res, 'get current user');
    return (await res.json()).user;
  }

  // ---- articles ------------------------------------------------------------

  rawCreateArticle(article: Partial<NewArticle>): Promise<APIResponse> {
    return this.authed((headers) => this.request.post(this.url('/articles'), { data: { article }, headers }));
  }

  async createArticle(article: NewArticle): Promise<Article> {
    const res = await this.rawCreateArticle(article);
    await expectOk(res, 'create article');
    return (await res.json()).article;
  }

  rawGetArticle(slug: string): Promise<APIResponse> {
    return this.authed((headers) => this.request.get(this.url(`/articles/${slug}`), { headers }));
  }

  async getArticle(slug: string): Promise<Article> {
    const res = await this.rawGetArticle(slug);
    await expectOk(res, `get article ${slug}`);
    return (await res.json()).article;
  }

  async listArticles(params: { author?: string; tag?: string; limit?: number } = {}): Promise<ArticlesResponse> {
    const res = await this.authed((headers) =>
      this.request.get(this.url('/articles'), { params: params as Record<string, string | number>, headers }),
    );
    await expectOk(res, 'list articles');
    return res.json();
  }

  async favorite(slug: string): Promise<Article> {
    const res = await this.authed((headers) => this.request.post(this.url(`/articles/${slug}/favorite`), { headers }));
    await expectOk(res, `favorite ${slug}`);
    return (await res.json()).article;
  }

  rawDeleteArticle(slug: string): Promise<APIResponse> {
    return this.authed((headers) => this.request.delete(this.url(`/articles/${slug}`), { headers }));
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
