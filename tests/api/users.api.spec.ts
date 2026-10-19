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

  test('signs in with valid credentials', async ({ api, workerUser }) => {
    const user = await api.login(workerUser.email, workerUser.password);

    expect(user).toMatchObject({ username: workerUser.username, email: workerUser.email });
  });

  test('the token identifies its owner', async ({ userApi, workerUser }) => {
    expect(await userApi.currentUser()).toMatchObject({ username: workerUser.username });
  });

  test('rejects a wrong password', async ({ api, workerUser }) => {
    const res = await api.rawLogin(workerUser.email, `${workerUser.password}-wrong`);

    expect(res.status()).toBe(401);
    expect((await res.json()).errors).toBeDefined();
  });

  test('rejects an unknown email', async ({ api }) => {
    const res = await api.rawLogin(buildUser().email, 'whatever');

    expect(res.status()).toBe(401);
  });
});
