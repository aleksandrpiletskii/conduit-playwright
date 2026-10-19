import { buildUser } from '../../src/data/factories';
import { expect, test } from '../../src/fixtures';

test.describe('Users API', () => {
  test('registers a user and returns a token', async ({ api }) => {
    const credentials = buildUser();

    const user = await api.register(credentials);

    expect(user).toMatchObject({ username: credentials.username, email: credentials.email });
    expect(user.token, 'auth token').toEqual(expect.any(String));
    expect(user.token.length).toBeGreaterThan(10);
  });

  test('signs in with valid credentials', async ({ api, newAccount }) => {
    const user = await api.login(newAccount.email, newAccount.password);

    expect(user).toMatchObject({ username: newAccount.username, email: newAccount.email });
  });

  test('the token identifies its owner', async ({ userApi, workerUser }) => {
    expect(await userApi.currentUser()).toMatchObject({ username: workerUser.username });
  });

  test('rejects a wrong password', async ({ api, newAccount }) => {
    const res = await api.rawLogin(newAccount.email, `${newAccount.password}-wrong`);

    expect(res.status()).toBe(401);
    expect((await res.json()).errors).toBeDefined();
  });

  test('rejects an unknown email', async ({ api }) => {
    const res = await api.rawLogin(buildUser().email, 'whatever');

    expect(res.status()).toBe(401);
  });
});
