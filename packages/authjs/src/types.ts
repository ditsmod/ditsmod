import type { RawRequest } from '@ditsmod/core';
import { property, REQUIRED } from '@ditsmod/openapi';
import type { AuthAction, Session } from '@auth/core/types';
import { ProviderType } from '@auth/core/providers';

export type GetSessionResult = Promise<Session | null>;

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

const descriptionOfAction =
  'Supported actions by Auth.js. Each action map to a REST API endpoint. Some actions' +
  ' have a GET and POST variant, depending on if the action changes the state of the server.' +
  ' See [AuthAction](https://authjs.dev/reference/core/types#authaction) for more info.';

const descriptionOfProviderType =
  'Provider passed to Auth.js must define one of these types.' +
  ' See [provider typess](https://authjs.dev/reference/core/providers#providertype) for more info.';

export class Params {
  @property({ [REQUIRED]: true, enum: actions, description: descriptionOfAction })
  action: AuthAction;

  @property({ [REQUIRED]: true, enum: providerTypes, description: descriptionOfProviderType })
  providerType: string;
}
