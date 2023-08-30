---
sidebar_position: 0
---

# @ditsmod/router

The `@ditsmod/router` module implements a router with the `Router` interface:

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

A ready-made example of using this module can be found in any example in the [Ditsmod repository][1].

## Installation and importing

Installation:

```bash
npm i @ditsmod/router
```

Importing:

```ts
import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

@rootModule({
  imports: [RouterModule],
  // ..
})
export class AppModule {}
```

## Custom router integration

If you want to integrate a custom router for the Ditsmod application, it is enough for your router to implement the above `Router` interface, after which it can be added to the providers at the application level:

```ts
import { featureModule, Router } from '@ditsmod/core';

import { MyRouter } from './my-router.js';

@featureModule({
  providersPerApp: [{ token: Router, useClass: MyRouter }],
})
export class MyCustomRouterModule {}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples
