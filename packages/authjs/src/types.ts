import type { RawRequest } from '@ditsmod/core';
import type { AuthAction, AuthConfig, Session } from '@auth/core/types';
import { ProviderType } from '@auth/core/providers';

export interface ReqForSession {
  protocol: 'http' | 'https';
  rawReq: RawRequest;
}

/**
 * As constant with array.
 */
export const actions: AuthAction[] = [
  'csrf',
  'providers',
  'session',
  'signin',
  'signout',
  'callback',
  'verify-request',
  'error',
  'webauthn-options',
];

export const providerTypes: ProviderType[] = [
  'credentials',
  'oidc',
  'oauth',
  'email',
  'webauthn'
];


export interface AuthjsConfig extends Omit<AuthConfig, 'raw'> {}
export type GetSessionResult = Promise<Session | null>;
