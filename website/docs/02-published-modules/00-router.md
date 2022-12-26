---
sidebar_position: 0
title: Роутер
---

# @ditsmod/router

В модулі `@ditsmod/router` реалізується маршрутизатор, що має інтерфейс `Router`:

```ts
interface Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this;

  all(path: string, handle: RouteHandler): this;

  find(method: HttpMethod, path: string): RouterReturns;
}

type RouteHandler = (
  nodeReq: NodeRequest,
  nodeRes: NodeResponse,
  params: PathParam[],
  queryString: any
) => Promise<void>;

class RouterReturns {
  handle: RouteHandler | null;
  params: PathParam[] | null;
}

interface PathParam {
  key: string;
  value: string;
}
```

Готовий приклад використання даного модуля можна знайти в будь-якому прикладі в [репозиторії Ditsmod][1].

## Встановлення та підключення

Встановлення:

```bash
yarn add @ditsmod/router
```

Підключення:

```ts
import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

@RootModule({
  imports: [RouterModule],
  // ..
})
export class AppModule {}
```

## Інтеграція кастомного роутера

Якщо ви хочете інтегрувати кастомний роутер для застосунку Ditsmod, достатньо щоб ваш роутер імплементував вищезазначений інтерфейс `Router`, після чого його можна додавати в провайдери на рівні застосунку:

```ts
import { featureModule, Router } from '@ditsmod/core';

import { MyRouter } from './my-router';

@featureModule({
  providersPerApp: [{ token: Router, useClass: MyRouter }],
})
export class MyCustomRouterModule {}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples
