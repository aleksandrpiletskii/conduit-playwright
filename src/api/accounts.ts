import { buildUser } from '../data/factories';
import type { ConduitApi } from './ConduitApi';
import type { User } from './types';

export interface AccountUser extends User {
  password: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Registers an account and makes sure its token really belongs to it.
 *
 * The public demo API sandboxes every account, and under concurrent sign-ups
 * a fresh token is occasionally resolved to a different account (seen in CI
 * as articles authored by someone else). So the account is not trusted until
 * a token issued a moment later resolves back to the same username; if it
 * doesn't, a new account is created.
 */
export async function createVerifiedAccount(api: ConduitApi, attempts = 5): Promise<AccountUser> {
  let lastSeen = '';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const credentials = buildUser();
    await api.register(credentials);

    // Let the second the account was created in pass, then take a new token.
    await sleep(1_100 + Math.floor(Math.random() * 400));
    const user = await api.login(credentials.email, credentials.password);
    const me = await api.as(user.token).currentUser();

    if (me.username === credentials.username) {
      return { ...user, password: credentials.password };
    }
    lastSeen = `token for ${credentials.username} resolved to ${me.username}`;
    await sleep(500 * attempt);
  }
  throw new Error(`Could not create a verified account after ${attempts} attempts (${lastSeen})`);
}
