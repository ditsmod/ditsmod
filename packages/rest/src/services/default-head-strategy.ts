import type { ServerResponse } from 'node:http';
import { injectable } from '@ditsmod/core';

import { NullBodyResponse } from './null-body-response.js';
import { RawResponse } from './request.js';
import { HeadStrategy } from './head-strategy.js';

@injectable()
export class DefaultHeadStrategy implements HeadStrategy {
  wrap(rawRes: RawResponse): RawResponse {
    return new NullBodyResponse(rawRes as ServerResponse);
  }
}