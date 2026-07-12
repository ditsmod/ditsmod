---
sidebar_position: 8
---

# @ditsmod/sentry

Цей модуль забезпечує інтеграцію з [Sentry](https://sentry.io) для застосунків Ditsmod.
Він дозволяє перехоплювати помилки, відстежувати продуктивність, профілювати методи та моніторити cron-завдання.

## Встановлення {#installation}

```bash
npm i @ditsmod/sentry @sentry/node
```

## Ініціалізація Sentry {#initializing-sentry}

Sentry необхідно ініціалізувати на самому початку файлу точки входу (`main.ts`) перед запуском застосунку Ditsmod:

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

## Підключення SentryModule {#importing-sentrymodule}

Імпортуйте `SentryModule` у ваш `AppModule` та вирішіть колізію `HttpErrorHandler`, оскільки `RestModule` і `SentryModule` обоє експортують цей провайдер:

```ts
import { ProviderBuilder } from '@ditsmod/core';
import { restRootModule, HttpErrorHandler } from '@ditsmod/rest';
import { SentryModule, SentryOptions } from '@ditsmod/sentry';

@restRootModule({
  imports: [SentryModule],
  providersPerMod: new ProviderBuilder().useValue<SentryOptions>(SentryOptions, {
    capture4xx: false,
  }),
  resolvedCollisionPerRou: [[HttpErrorHandler, SentryModule]],
})
export class AppModule {}
```

## Можливості {#features}

### SentryHttpErrorHandler {#sentry-http-error-handler}

Автоматично перехоплює всі непередбачувані помилки сервера (коди статусів `>= 500` або загальні необроблені виключення).
Він інтегрується з `ErrorInfo` від Ditsmod, додаючи коди помилок, рівень важливості та внутрішні повідомлення розробника як теги або extras.
Додаткове перехоплення помилок 4xx можна увімкнути, встановивши `capture4xx: true` в `SentryOptions`.

### Відстеження продуктивності {#performance-tracing}

Якщо Sentry активовано, наступні інтерцептори будуть автоматично зареєстровані для всіх REST-маршрутів:

- `SentryTracingInterceptor`: динамічно розпізнає шляхи роутів через `RouteMeta` та оновлює назви транзакцій.
- `SentrySpanInterceptor`: обгортає виконання HTTP-запиту в спан відстеження продуктивності.

### Декоратори {#decorators}

- `@sentryTraced(op?)`: обгортає виконання методу класу в спан Sentry.
- `@sentryCron(monitorSlug, monitorConfig?)`: обгортає виконання періодичних cron-завдань та надсилає чек-іни до Sentry.
- `@sentryExceptionCaptured()`: обгортає виконання методу в try-catch, надсилає виключення до Sentry та прокидає помилку далі.
