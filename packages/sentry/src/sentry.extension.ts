import { getIsolationScope, getDefaultIsolationScope } from '@sentry/core';

import { injectable, Logger, ExtensionManager } from '@ditsmod/core';
import type { Extension } from '@ditsmod/core';
import { RestRouteExtension, HTTP_INTERCEPTORS } from '@ditsmod/rest';

import { SentrySpanInterceptor } from './sentry-span.interceptor.js';
import { SentryTracingInterceptor } from './sentry-tracing.interceptor.js';
import type { SentryRouteMeta } from './types.js';

@injectable()
export class SentryExtension implements Extension<void> {
  constructor(
    private extensionManager: ExtensionManager,
    private logger: Logger,
  ) {}

  async stage1(): Promise<void> {
    if (getIsolationScope() === getDefaultIsolationScope()) {
      this.logger.log(
        'warn',
        'Sentry.init() was not called before application bootstrap. Sentry integration is disabled.',
      );
      return;
    }

    const meta = await this.extensionManager.stage1(RestRouteExtension);

    for (const routeExtensionMeta of meta.groupData) {
      for (const controllerMetadata of routeExtensionMeta.aControllerMetadata) {
        // Dynamically append the fullPath to routeMeta
        (controllerMetadata.routeMeta as SentryRouteMeta).fullPath = controllerMetadata.fullPath;

        controllerMetadata.providersPerReq.push(
          SentrySpanInterceptor,
          {
            token: HTTP_INTERCEPTORS,
            useToken: SentrySpanInterceptor,
            multi: true,
          },
          SentryTracingInterceptor,
          {
            token: HTTP_INTERCEPTORS,
            useToken: SentryTracingInterceptor,
            multi: true,
          },
        );
      }
    }
  }
}
