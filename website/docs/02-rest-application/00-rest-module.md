---
sidebar_position: 0
title: "@ditsmod/rest"
---

# @ditsmod/rest

Як видно з назви, модуль `@ditsmod/rest` забезпечує підтримку [REST][0]. Він містить зокрема:

- [ініт-декоратори][4] для кореневого модуля та модуля фіч - `restRootModule`, `restModule`;
- розширення, які забезпечують створення REST-роутів - `RestRouteExtension`, `PreRouterExtension`;
- роутер, що має наступний тип:

```ts
interface Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this;
  all(path: string, handle: RouteHandler): this;
  find(method: HttpMethod, path: string): RouteMatch;
}

type RouteHandler = (
  rawReq: RawRequest,
  rawRes: RawResponse,
  params: PathParam[],
  queryString: any
) => Promise<void>;

class RouteMatch {
  handle: RouteHandler | null;
  params: PathParam[] | null;
}

interface PathParam {
  key: string;
  value: string;
}
```

Готовий приклад використання даного модуля можна знайти в прикладах [репозиторія Ditsmod][1].

## Встановлення та підключення {#installation-and-importing}

Встановлення:

```bash
npm i @ditsmod/rest
```

Підключення:

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  // ..
})
export class AppModule {}
```

## Інтеграція кастомного роутера {#custom-router-integration}

Якщо ви хочете інтегрувати кастомний роутер для застосунку Ditsmod, достатньо щоб ваш роутер імплементував вищезазначений інтерфейс `Router`, після чого його можна додавати в провайдери на рівні застосунку:

```ts
import { restModule, Router } from '@ditsmod/rest';
import { MyRouter } from './my-router.js';

@restModule({
  providersPerApp: [{ token: Router, useClass: MyRouter }],
})
export class MyCustomRouterModule {}
```

## `RestRouteExtension` {#route-extension}

З даного модуля експортується `RestRouteExtension`. Дане розширення повертає метадані з інтерфейсом [`Array<RouteExtensionMeta>`][2] - це масив динамічних метаданих, які призначені для створення обробників запитів. Кожен елемент цього масиву - це окремий роут.

## `PreRouterExtension` {#pre-router-extension}

З даного модуля також експортується `PreRouterExtension`. Дане розширення використовує метадані, які повертає `RestRouteExtension`, щоб створювати обробники HTTP-запитів.

[0]: https://uk.wikipedia.org/wiki/REST
[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/01-hello-world
[2]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/rest/src/types/types.ts#L21-L27
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.16.0/packages/body-parser/src/body-parser.extension.ts#L54
[4]: /deep-dive/init-decorators/
