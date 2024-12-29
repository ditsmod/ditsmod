import type { AuthConfig, Session } from '@auth/core/types';

export { AuthAction } from '@auth/core/types';
export { customFetch, isAuthAction } from '@auth/core';
export { AuthError, CredentialsSignin } from '@auth/core/errors';
export type { Account, DefaultSession, Profile, Session, User } from '@auth/core/types';
export interface AuthjsConfig extends Omit<AuthConfig, 'raw'> {}
export type GetSessionResult = Promise<{ data: Session | null; cookie: any }>;
export { actions, providerTypes } from './types.js';
export { ProviderType } from '@auth/core/providers';

export { AuthjsModule } from './authjs.module.js';
export { AUTHJS_CONFIG, AUTHJS_SESSION } from './constants.js';
export { AuthjsGuard } from './authjs.guard.js';
export { getSession } from './get-session.js';
export { AuthjsLogMediator } from './authjs-log-mediator.js';
