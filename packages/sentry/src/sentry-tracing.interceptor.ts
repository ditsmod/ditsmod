import { getIsolationScope } from '@sentry/core';

import { injectable, optional } from '@ditsmod/core';
import type { HttpInterceptor, HttpHandler, BaseRequestContext } from '@ditsmod/rest';

import type { SentryRouteMeta } from './types.js';

@injectable()
export class SentryTracingInterceptor implements HttpInterceptor {
  readonly __SENTRY_INTERNAL__ = true;

  constructor(@optional() private routeMeta?: SentryRouteMeta) {}

  async intercept(next: HttpHandler, ctx: BaseRequestContext): Promise<any> {
    const method = (ctx.rawReq.method ?? 'GET').toUpperCase();
    const pattern = this.routeMeta ? `/${this.routeMeta.fullPath ?? ctx.rawReq.url}` : (ctx.rawReq.url ?? '/');
    const transactionName = `${method} ${pattern}`;

    getIsolationScope().setTransactionName(transactionName);

    return next.handle();
  }
}
