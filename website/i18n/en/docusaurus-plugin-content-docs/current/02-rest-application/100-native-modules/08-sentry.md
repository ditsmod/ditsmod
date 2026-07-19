---
sidebar_position: 8
---

# @ditsmod/sentry

This module provides integration with [Sentry](https://sentry.io) for Ditsmod applications.
It enables error capturing, performance tracing, custom method profiling, and cron monitoring.

## Installation {#installation}

```bash
npm i @ditsmod/sentry @sentry/node
```

## Initializing Sentry {#initializing-sentry}

Sentry must be initialized at the very top of your entry point file (`main.ts`) before bootstrapping the Ditsmod application:

```ts
import { init } from '@ditsmod/sentry';

init({
  dsn: 'YOUR_SENTRY_DSN',
  tracesSampleRate: 1.0,
});

import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

## Importing SentryModule {#importing-sentrymodule}

Import `SentryModule` in your `AppModule` and resolve the `HttpErrorHandler` collision because both `RestModule` and `SentryModule` export error handler providers:

```ts
import { ProviderBuilder } from '@ditsmod/core';
import { restRootModule, HttpErrorHandler } from '@ditsmod/rest';
import { SentryModule, SentryOptions } from '@ditsmod/sentry';

@restRootModule({
  imports: [SentryModule],
  providersPerMod: new ProviderBuilder().useValue<SentryOptions>(SentryOptions, {
    capture4xx: false,
  }),
  resolvedCollisionsPerRou: [[HttpErrorHandler, SentryModule]],
})
export class AppModule {}
```

## Features {#features}

### SentryHttpErrorHandler {#sentry-http-error-handler}

Automatically captures all unexpected server exceptions (status code `>= 500` or generic uncaught errors).
It integrates with Ditsmod `ErrorInfo` to attach custom error codes, severity levels, and private developer messages as tags or extras.
Optional 4xx capturing can be enabled by setting `capture4xx: true` in `SentryOptions`.

### Performance Tracing {#performance-tracing}

If Sentry is active, the following interceptors are automatically registered on all REST routes:

- `SentryTracingInterceptor`: dynamically resolves route paths via `RouteMeta` and updates transaction names.
- `SentrySpanInterceptor`: wraps the request execution in a performance tracking span.

### Decorators {#decorators}

- `@sentryTraced(op?)`: wraps class method execution with a Sentry Span.
- `@sentryCron(monitorSlug, monitorConfig?)`: wraps periodic cron job execution and sends check-ins to Sentry.
- `@sentryExceptionCaptured()`: wraps method execution in a try-catch, reports unhandled exceptions to Sentry, and propagates the error.
