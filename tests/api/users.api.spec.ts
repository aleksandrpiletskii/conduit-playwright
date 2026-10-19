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

  test('signs in with the registered credentials', async ({ api }) => {
    const credentials = buildUser();
    await api.register(credentials);

    const user = await api.login(credentials.email, credentials.password);

    expect(user.username).toBe(credentials.username);
    expect(await api.as(user.token).currentUser()).toMatchObject({ username: credentials.username });
  });

  test('rejects a wrong password', async ({ api, workerUser }) => {
    const res = await api.rawLogin(workerUser.email, `${workerUser.password}-wrong`);

    expect(res.ok()).toBe(false);
    expect([401, 403, 422]).toContain(res.status());
  });

  test('rejects a duplicate email with a validation error', async ({ api, workerUser }) => {
    const res = await api.rawRegister(buildUser({ email: workerUser.email }));

    // The RealWorld spec prescribes 422; some backends answer 409 Conflict.
    expect([409, 422]).toContain(res.status());
    expect((await res.json()).errors).toBeDefined();
  });
});
