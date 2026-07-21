import { getClient } from '@sentry/core';

import { injectable, Logger, ExtensionManager } from '@ditsmod/core';
import type { Extension } from '@ditsmod/core';
import { RestRouteExtension, HTTP_INTERCEPTORS } from '@ditsmod/rest';

import { SentryTracingInterceptor } from './sentry-tracing.interceptor.js';
import type { SentryRouteMeta } from './types.js';

@injectable()
export class SentryExtension implements Extension<void> {
  constructor(
    private extensionManager: ExtensionManager,
    private logger: Logger,
  ) {}

  async stage1(): Promise<void> {
    if (!getClient()?.getDsn()) {
      this.logger.log(
        'warn',
        'Sentry.init() was not called with a valid DSN before application bootstrap. Sentry integration is disabled.',
      );
      return;
    }

    const meta = await this.extensionManager.stage1(RestRouteExtension);

    for (const routeExtensionMeta of meta.groupData) {
      for (const controllerMeta of routeExtensionMeta.controllersMeta) {
        // Dynamically append the fullPath to routeMeta
        (controllerMeta.routeMeta as SentryRouteMeta).fullPath = controllerMeta.fullPath;

        controllerMeta.providersPerReq.push(SentryTracingInterceptor, {
          token: HTTP_INTERCEPTORS,
          useToken: SentryTracingInterceptor,
          multi: true,
        });
      }
    }
  }
}
