---
sidebar_position: 1
---

# @ditsmod/trpc

Модуль `@ditsmod/trpc` забезпечує інтеграцію з [@trpc/server][1]. Готовий приклад застосунку з `@ditsmod/trpc` можна [проглянути у репозиторії Ditsmod][2]. Там ви можете знайти приклади застосування ґардів та інтерсепторів.

## Швидкий старт

Ви також можете скористатись моно-репозиторієм, в якому є мінімальний код для швидкого старту:

```bash
git clone --depth 1 https://github.com/ditsmod/trpc-monorepo-starter.git
```

## Як формуються типи для клієнта на рівні модуля

Ditsmod намагається бути прозорим для `@trpc/client` надаючи можливість TypeScript виводити типи зі статичного коду, без необхідності додаткової компіляції для клієнта. Кожен модуль, що надає конфігурацію для tRPC-роутера, повинен це робити у методі `getRouterConfig()`:

```ts {9,18-23}
import { featureModule } from '@ditsmod/core';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';
import { RouterOf } from '@ditsmod/trpc/client';

import { CommentModule } from './comments/comment.module.js';
import { PostController } from './post.controller.js';

// For TRPCClient
export type PostRouter = RouterOf<typeof PostModule>;

@initTrpcModule({
  imports: [CommentModule],
  controllers: [PostController],
})
@featureModule()
export class PostModule implements ModuleWithTrpcRoutes {
  getRouterConfig() {
    return {
      post: {
        createPost: PostController.prototype.createPost, // Pointed to a controller
        comments: CommentModule.prototype.getRouterConfig, // Pointed to a module
      },
    };
  }
}
```

Тут `ModuleWithTrpcRoutes` - це інтерфейс, який гарантує наявність методу `getRouterConfig()` у даному модулі.

В даному прикладі, показано конфіг, на основі якого буде створено:

1. роут `post.createPost`, за який відповідатиме метод контролера - `PostController.prototype.createPost`;
2. група роутів `post.comments`, за який відповідатиме імпортований модуль - `CommentModule.prototype.getRouterConfig`. Можна здогадатись, що `CommentModule` має свій метод `getRouterConfig()`, в якому вже уточнюється які саме контролери створюють певні роути.

Зверніть увагу, що тут створюється тип `PostRouter` для tRPC-клієнта. Це рекомендується робити для кожного невкладеного(!) модуля, щоб пом'якшити [проблеми з TypeScript-перформенсом][3], коли він виводить типи зі складних моделей. Але пам'ятайте, що такі типи не будуть коректно працювати для вкладених модулів. У даному прикладі `CommentModule` є вкладеним, тому для нього не доцільно робити `export type CommentsRouter = RouterOf<typeof CommentsModule>`.

Також ви можете централізовано виводити єдиний тип для змердженого tRPC-роутера на рівні застосунку, але це рекомендується робити лише у випадку, якщо у вас немає планів створювати складні моделі, аналізуючи які TypeScript буде "помирати". Щоб централізовано вивести єдиний роутер на увесь застосунок, треба скористатись `AppRouterHelper`:

```ts {9-10,13}
import { rootModule } from '@ditsmod/core';
import type { SetAppRouterOptions, TrpcCreateOptions, TrpcRootModule } from '@ditsmod/trpc';
import type { AppRouterHelper } from '@ditsmod/trpc/client';

import { PostModule } from '#post/post.module.js';
import { AuthModule } from '#auth/auth.module.js';
import { MessageModule } from '#message/message.module.js';

const modulesWithTrpcRoutes = [AuthModule, PostModule, MessageModule] as const;
export type AppRouter = AppRouterHelper<typeof modulesWithTrpcRoutes>;

@rootModule({
  imports: [...modulesWithTrpcRoutes],
})
export class AppModule implements TrpcRootModule {
  setTrpcCreateOptions(): TrpcCreateOptions {
    return {
      // Passing options for initTRPC.create()
    };
  }

  setAppRouterOptions(): SetAppRouterOptions {
    return {
      basePath: '/trpc/',
    };
  }
}
```

Зверніть увагу, що у `AppRouterHelper` передається не просто масив імпортованих модулів, а цей масив ще й позначено за допомогою `as const` - це важлива умова, без якої `AppRouterHelper` працюватиме некоректно.

Також зверніть увагу на інтерфейс `TrpcRootModule`, який вимагає обов'язкового впровадження методу `setAppRouterOptions()`, також опціонально можна імплементувати `setTrpcCreateOptions()`. Коли ваш метод `setAppRouterOptions()` повертає конфіг для роутера, ви не зможете передати опцію `createContext`, оскільки Ditsmod автоматично створює контекст у вигляді об'єкту `{ req, res }` щоб гарантувати доступність цих змінних в контексті. Звичайно ж, в процедурах ви можете додавати будь-які інші властивості контекста.

## Як формуються типи для клієнта на рівні метода контролера

Кожен метод контролера, що створює роут, повинен мати декоратор `trpcRoute` та повинен поверти tRPC-процедуру:

```ts {8-10}
import { trpcController, RouteService, trpcRoute } from '@ditsmod/trpc';
import { z } from 'zod';

@trpcController()
export class PostController {
  @trpcRoute()
  createPost(routeService: RouteService) {
    return routeService.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
      return { ...input, id: 1, body: 'post text' };
    });
  }
}
```

Тобто, якщо вам достатньо користуватись перевагами DI на рівні роуту (а не на рівні HTTP-запиту), то ваш код буде мало відрізнятись від нативного tRPC-коду. Практично єдина відмінність лише у тому, що вам початкову процедуру потрібно брати із `RouteService`, як показано у даному прикладі. До речі, `RouteService` можна вказувати тип контексту та інпуту - `RouteService<SomeContext, SomeInput>`. Майте на увазі, що якщо ви збираєтесь у коді писати `routeService.procedure.input(...)`, то вам не потрібно передавати другий дженерік, бо типи інпутів будуть конфліктувати. Другий дженерік є сенс використовувати у випадку, якщо валідацію ви робите автоматично в інтерсепторах, а не безпосередньо у коді роуту.

Окрім `RouteService`, у параметрах методу контролера ви можете запитувати будь-який інший сервіс на рівні роуту, причому порядок параметрів не має значення:

```ts {4}
@trpcController()
export class PostController {
  @trpcRoute()
  createPost(service1: Service1, service2: Service2, routeService: RouteService) {
    // ...
  }
}
```

У випадку, якщо вам потрібно буде використовувати ґарди чи інтерсептори, вам достатньо їх додати відповідно у перший та другий масив у декораторі `trpcRoute`:

```ts {9}
import { trpcController, RouteService, trpcRoute } from '@ditsmod/trpc';
import { z } from 'zod';

import { BearerGuard } from '../auth/bearer.guard.js';
import { MyInterceptor } from './my.interceptor.js';

@trpcController()
export class PostController {
  @trpcRoute([BearerGuard], [MyInterceptor])
  createPost(routeService: RouteService) {
    return routeService.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
      return { ...input, id: 1, body: 'post text' };
    });
  }
}
```

## Як користуватись типами роутера на клієнті

Як було сказано вище, щоб пом'якшити [проблеми з TypeScript-перформенсом][3], рекомендується виводити тип для кожного невкладеного(!) модуля. Під "невкладеним модулем" мається на увазі той модуль, який безпосередньо імпортується у кореневий модуль. Отже, під час створення клієнта, рекомендується використовувати узагальнений тип для роутера - `createTRPCClient<AnyTRPCRouter>()`, а потім уточнювати тип для кожного окремого модуля:

```ts
import type { AnyTRPCRouter } from '@trpc/server';
import { createTRPCClient, TRPCClient } from '@trpc/client';
import type { PostRouter } from 'server'; // You can give this name in your monorepo

const trpc = createTRPCClient<AnyTRPCRouter>({
  // ...
});

const postClient = trpc as TRPCClient<PostRouter>;
const post = await postClient.post.createPost.mutate({ title: 'hello client' });
```

[1]: https://trpc.io/docs/quickstart
[2]: https://github.com/ditsmod/ditsmod/tree/main/examples/18-trpc-server
[3]: https://github.com/trpc/trpc/discussions/2448
