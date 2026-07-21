import * as Sentry from '@sentry/node';

import { injectable, HttpStatus, optional, ParentParams } from '@ditsmod/core';
import { isCustomError } from '@ditsmod/core/errors';
import { DefaultHttpErrorHandler } from '@ditsmod/rest';
import type { RequestContext } from '@ditsmod/rest';

import { SentryOptions } from './types.js';

@injectable()
export class SentryHttpErrorHandler extends DefaultHttpErrorHandler {
  constructor(
    protected parentParams: ParentParams,
    @optional() protected sentryOptions?: SentryOptions,
  ) {
    // @ts-expect-error auto inject
    super(...parentParams);
  }

  override async handleError(err: Error, ctx: RequestContext): Promise<void> {
    if (this.shouldCapture(err)) {
      const scope = Sentry.getCurrentScope();
      // Attach HTTP request context
      scope.setTag('http.method', ctx.rawReq.method ?? 'UNKNOWN');
      scope.setTag('http.url', ctx.rawReq.url ?? '');

      // Attach Ditsmod-specific metadata from ErrorInfo
      if (isCustomError(err)) {
        scope.setTag('error.code', err.code ?? '');
        scope.setTag('error.level', err.info.level ?? 'warn');
        // msg2 is the internal developer message — send as extra
        if (err.info.msg2) {
          scope.setExtra('error.msg2', err.info.msg2);
        }
        if (err.info.args2) {
          scope.setExtra('error.args2', err.info.args2);
        }
      }

      // Attach route parameters as breadcrumb/extra context
      if (ctx.rawPathParams?.length) {
        scope.setExtra('route.params', Object.fromEntries(ctx.rawPathParams.map(({ key, value }) => [key, value])));
      }

      Sentry.captureException(err, {
        mechanism: {
          handled: false,
          type: this.getMechanismType(err),
        },
      });
    }

    // Delegate response-writing to the parent
    return super.handleError(err, ctx);
  }

  protected shouldCapture(err: Error): boolean {
    if (!isCustomError(err)) return true; // always capture unknown errors
    const { status = HttpStatus.INTERNAL_SERVER_ERROR, level = 'warn' } = err.info;
    if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
      if (this.sentryOptions?.capture4xx) {
        return true;
      }
      if (level === 'warn' || level === 'debug' || level === 'info') {
        return false;
      }
    }
    return true;
  }

  protected getMechanismType(err: Error): string {
    return 'auto.http.ditsmod.error_handler';
  }
}
