import { injectable } from '@ditsmod/core';

import type { RawRequest, RawResponse } from './request.js';
import type { PathParam } from './router.js';
import { RAW_PATH_PARAMS, QUERY_STRING, RAW_REQ, RAW_RES } from '../top/constants.js';
import { BaseRequestContext } from './base-request-context.js';

@injectable()
export class RequestContext extends BaseRequestContext {
  setCtx(rawReq: RawRequest, rawRes: RawResponse, aPathParams: PathParam[] | null, queryString: string) {
    this.rawReq = rawReq;
    this.rawRes = rawRes;
    this.aPathParams = aPathParams;
    this.queryString = queryString;

    this.set(RAW_REQ, rawReq)
      .set(RAW_RES, rawRes)
      .set(RAW_PATH_PARAMS, aPathParams)
      .set(QUERY_STRING, queryString || '');
    return this;
  }
}
