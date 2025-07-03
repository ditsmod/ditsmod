import type { RawRequest } from '@ditsmod/rest';
import type { AuthAction, Session } from '@auth/core/types';
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

export type GetSessionResult = Promise<Session | null>;
