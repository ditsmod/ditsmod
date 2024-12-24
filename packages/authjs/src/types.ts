import type { RawRequest } from '@ditsmod/core';
import type { Session } from '@auth/core/types';

export type GetSessionResult = Promise<Session | null>;

export interface ReqForSession {
  protocol: 'http' | 'https';
  rawReq: RawRequest;
}
