import * as Sentry from '@sentry/node';
import { injectable } from '@ditsmod/core';
import { RequestDispatcher } from '@ditsmod/rest';
import type { RawRequest, RawResponse } from '@ditsmod/rest';

@injectable()
export class SentryRequestDispatcher extends RequestDispatcher {
  override async requestListener(rawReq: RawRequest, rawRes: RawResponse) {
    return Sentry.withIsolationScope(async () => {
      const traceHeaders = rawReq.headers['sentry-trace'];
      const baggage = rawReq.headers['baggage'];

      return Sentry.continueTrace(
        {
          sentryTrace: traceHeaders as string,
          baggage: baggage as string,
        },
        () => {
          const [pathname] = (rawReq.url || '').split('?');
          return Sentry.startSpan(
            {
              name: `${rawReq.method} ${pathname}`,
              op: 'http.server',
            },
            async (span) => {
              try {
                await super.requestListener(rawReq, rawRes);
              } catch (err) {
                Sentry.captureException(err);
                throw err;
              } finally {
                const statusCode = rawRes.statusCode;
                if (statusCode >= 400) {
                  span?.setStatus({ code: 2, message: `HTTP ${statusCode}` });
                } else {
                  span?.setStatus({ code: 1 });
                }
              }
            },
          );
        },
      );
    });
  }

  override sendInternalServerError(rawRes: RawResponse, err: Error) {
    Sentry.captureException(err);
    super.sendInternalServerError(rawRes, err);
  }
}
