---
sidebar_position: 0
title: "@ditsmod/rest"
---

# @ditsmod/rest

Як видно з назви, модуль `@ditsmod/rest` забезпечує підтримку [REST][0]. Він містить зокрема:

- [ініт-декоратори][4] для кореневого модуля та модуля фіч - `restRootModule`, `restModule`;
- розширення, які забезпечують створення REST-роутів - `RoutesExtension`, `PreRouterExtension`;
- роутер, що має наступний тип:

```ts
interface Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this;
  all(path: string, handle: RouteHandler): this;
  find(method: HttpMethod, path: string): RouterReturns;
}

type RouteHandler = (
  rawReq: RawRequest,
  rawRes: RawResponse,
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

## Група розширень `ROUTES_EXTENSIONS` {#extensions-group-routes_extensions}

З даного модуля експортується токен групи розширень `ROUTES_EXTENSIONS`. Розширення з цієї групи повертають метадані з інтерфейсом [`Array<MetadataPerMod3>`][2] - це масив динамічних метаданих, які призначені для створення обробників запитів. Кожен елемент цього масиву - це окремий роут.

## Група розширень `PRE_ROUTER_EXTENSIONS` {#extensions-group-pre_router_extensions}

З даного модуля також експортується токен групи розширень `PRE_ROUTER_EXTENSIONS`. Розширення з цієї групи використовує метадані, які повертає група розширень `ROUTES_EXTENSIONS`, щоб створювати обробники HTTP-запитів.

[0]: https://uk.wikipedia.org/wiki/REST
[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/01-hello-world
[2]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/types/metadata-per-mod.ts#L58-L74
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.16.0/packages/body-parser/src/body-parser.extension.ts#L54
[4]: /basic-components-of-the-app/init-decorators/
