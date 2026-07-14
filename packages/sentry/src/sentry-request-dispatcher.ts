import * as Sentry from '@sentry/node';
import { injectable, SystemLogMediator } from '@ditsmod/core';
import { RequestDispatcher, Router } from '@ditsmod/rest';
import type { RawResponse } from '@ditsmod/rest';

@injectable()
export class SentryRequestDispatcher extends RequestDispatcher {
  constructor(router: Router, systemLogMediator: SystemLogMediator) {
    super(router, systemLogMediator);
    const originalRequestListener = this.requestListener;

    this.requestListener = async (rawReq, rawRes) => {
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
                  await originalRequestListener(rawReq, rawRes);
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
    };
  }

  override sendInternalServerError(rawRes: RawResponse, err: Error) {
    Sentry.captureException(err);
    super.sendInternalServerError(rawRes, err);
  }
}
