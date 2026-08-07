# @holu/sentry

This module provides integration with [Sentry](https://sentry.io) for Holu applications, enabling error logging, performance tracing, custom span profiling, and cron monitoring.

## Installation

```bash
yarn add @holu/sentry
```

## Basic Setup

### 1. Initialize Sentry in `main.ts`

Initialize Sentry at the very top of your entry point file (`main.ts`) before bootstrapping Holu. Import `init` from `@holu/sentry` to ensure that Holu SDK metadata is correctly registered in the Sentry dashboard:

```ts
import { init } from '@holu/sentry';

init({
  dsn: 'YOUR_SENTRY_DSN',
  tracesSampleRate: 1.0,
});

import { RestApplication } from '@holu/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

### 2. Import SentryModule & Resolve Collision

Import `SentryModule` in your `AppModule` and resolve the `HttpErrorHandler` collision because both `RestModule` and `SentryModule` export error handler providers.

```ts
import { ProviderBuilder } from '@holu/core';
import { restRootModule, HttpErrorHandler } from '@holu/rest';
import { SentryModule, SentryOptions } from '@holu/sentry';

import { ExampleController } from './example.controller.js';

@restRootModule({
  imports: [SentryModule],
  controllers: [ExampleController],
  providersPerMod: new ProviderBuilder().useValue<SentryOptions>(SentryOptions, {
    capture4xx: false, // Set to true to also report 4xx client errors to Sentry
  }),
  resolvedCollisionsPerRou: [[HttpErrorHandler, SentryModule]],
})
export class AppModule {}
```

---

## Features

### 1. HTTP Error Handler (`SentryHttpErrorHandler`)

Automatically captures all unexpected server exceptions (status code `>= 500` or generic uncaught errors).

- Integrates with Holu `ErrorInfo` to attach custom error codes, severity levels, and private developer messages as tags or extras.
- Optional 4xx capturing: passing `capture4xx: true` via `SentryOptions` reports client-side errors like 400 Bad Request to Sentry.

### 2. Performance Tracing Interceptors

If Sentry is active, the following interceptors are automatically registered on all REST routes:

- **`SentryTracingInterceptor`**: Resolves route path dynamically via `RouteMeta` and updates the transaction name (e.g., `GET /users/:id`).
- **`SentrySpanInterceptor`**: Wraps the request execution in a performance tracking span.

> [!TIP]
> If Sentry is not initialized (`Sentry.init()` was not called), the `SentryExtension` outputs a console warning at bootstrap and completely skips registering these interceptors. This eliminates runtime overhead for disabled/development configurations.

### 3. Decorators

All decorators start with a lowercase letter according to the Holu style standards.

#### `@sentryTraced(op?)`

Wraps class method execution with a Sentry Span to measure custom operations:

```ts
import { sentryTraced } from '@holu/sentry';

class UsersService {
  @sentryTraced('db.query')
  async fetchUsers() {
    return db.query('SELECT * FROM users');
  }
}
```

#### `@sentryCron(monitorSlug, monitorConfig?)`

Wraps periodic cron job execution and sends check-ins (heartbeats) to Sentry:

```ts
import { sentryCron } from '@holu/sentry';

class JobService {
  @sentryCron('sync-database', {
    schedule: { type: 'crontab', value: '*/30 * * * *' },
  })
  async sync() {
    // Database sync logic
  }
}
```

#### `@sentryExceptionCaptured()`

Automatically wraps method execution in a try-catch (supporting both synchronous calls and promise rejections), reports unhandled exceptions to Sentry, and propagates the error. It ignores expected Holu custom client errors:

```ts
import { sentryExceptionCaptured } from '@holu/sentry';

class AnalyticsService {
  @sentryExceptionCaptured()
  trackMetrics() {
    throw new Error('Analytics server unreachable');
  }
}
```

---

## Background Tasks & Isolation Scope

> [!CAUTION]
> HTTP requests are automatically wrapped in Sentry isolation scopes to prevent data leakage. However, background tasks (such as queue processors, custom event listeners, or cron jobs) do not automatically run within separate isolation scopes.
>
> When implementing background task handlers, you should manually wrap execution in `withIsolationScope` (imported from `@sentry/node`) to prevent context leak:
>
> ```ts
> import * as Sentry from '@sentry/node';
>
> async function handleBackgroundJob(job: Job) {
>   return Sentry.withIsolationScope(async () => {
>     // Your task logic here
>   });
> }
> ```
