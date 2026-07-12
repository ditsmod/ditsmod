import * as Sentry from '@sentry/node';

import { injectable, optional } from '@ditsmod/core';
import type { HttpInterceptor, HttpHandler, BaseRequestContext } from '@ditsmod/rest';

import type { SentryRouteMeta } from './types.js';

@injectable()
export class SentrySpanInterceptor implements HttpInterceptor {
  constructor(@optional() private routeMeta?: SentryRouteMeta) {}

  async intercept(next: HttpHandler, ctx: BaseRequestContext): Promise<any> {
    const method = (ctx.rawReq.method ?? 'GET').toUpperCase();
    const path = this.routeMeta ? `/${this.routeMeta.fullPath ?? ctx.rawReq.url}` : (ctx.rawReq.url ?? '/');

    return Sentry.withIsolationScope(() => {
      return Sentry.startSpan(
        {
          name: `${method} ${path}`,
          op: 'http.server',
          attributes: {
            'http.method': method,
            'http.route': path,
          },
        },
        (span) => {
          return next.handle().catch((err) => {
            span?.setStatus({ code: 2, message: (err as Error).message });
            throw err;
          });
        },
      );
    });
  }
}
