---
sidebar_position: 0
title: "@ditsmod/rest"
---

# @ditsmod/rest

As the name suggests, the `@ditsmod/rest` module provides support for [REST][0]. It includes:

- [init decorators][4] for the root module and the feature module - `restRootModule`, `restModule`;
- extensions that provide REST route creation - `RestRouteExtension`, `DispatcherExtension`;
- a router of the following type:

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

A ready-made example of using this module can be found in the examples [Ditsmod repository][1].

## Installation and importing {#installation-and-importing}

Installation:

```bash
npm i @ditsmod/rest
```

Importing:

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  // ..
})
export class AppModule {}
```

## Custom router integration {#custom-router-integration}

If you want to integrate a custom router for the Ditsmod application, it is enough for your router to implement the above `Router` interface, after which it can be added to the providers at the application level:

```ts
import { restModule, Router } from '@ditsmod/rest';
import { MyRouter } from './my-router.js';

@restModule({
  providersPerApp: [{ token: Router, useClass: MyRouter }],
})
export class MyCustomRouterModule {}
```

## `RestRouteExtension` {#route-extension}

This module exports `RestRouteExtension`. This extension returns metadata with the [`Array<RouteExtensionMeta>`][2] interface — an array of dynamic metadata intended for creating request handlers. Each element of this array represents a separate route.

## `DispatcherExtension` {#request-dispatcher-extension}

This module also exports `DispatcherExtension`. This extension uses the metadata returned by `RestRouteExtension` to create HTTP request handlers.

[0]: https://en.wikipedia.org/wiki/REST
[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/01-hello-world
[2]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/rest/src/types/types.ts#L21-L27
[3]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/body-parser/src/body-parser.extension.ts#L41
[4]: /deep-dive/init-decorators/
