import type { AuthConfig, Session, AuthAction } from '@auth/core/types';

export { AuthjsModule } from './authjs.module.js';
export { AUTHJS_CONFIG, AUTHJS_SESSION } from './constants.js';
export { AuthjsGuard } from './authjs.guard.js';
export { getSession } from './get-session.js';

export { AuthAction } from '@auth/core/types';
export { customFetch, isAuthAction } from '@auth/core';
export { AuthError, CredentialsSignin } from '@auth/core/errors';
export type { Account, DefaultSession, Profile, Session, User } from '@auth/core/types';
export interface AuthjsConfig extends Omit<AuthConfig, 'raw'> {}
export type GetSessionResult = Promise<{ data: Session | null; cookie: any }>;
export const actions: AuthAction[] = [
  'providers',
  'session',
  'csrf',
  'signin',
  'signout',
  'callback',
  'verify-request',
  'error',
  'webauthn-options',
];
