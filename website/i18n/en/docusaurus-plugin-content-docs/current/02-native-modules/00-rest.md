---
sidebar_position: 0
---

# @ditsmod/rest

The `@ditsmod/rest` module implements a router with the `Router` interface:

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

A ready-made example of using this module can be found in any example in the [Ditsmod repository][1].

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

## Extensions group `ROUTES_EXTENSIONS` {#extensions-group-routes_extensions}

The extensions group token `ROUTES_EXTENSIONS` is exported from this module. Extensions from this group return metadata with interface [`Array<MetadataPerMod3>`][2] is an array of dynamic metadata that is intended for creating request handlers. Each item of this array is a separate route.

## Extensions group `PRE_ROUTER_EXTENSIONS` {#extensions-group-pre_router_extensions}

The extensions group token `PRE_ROUTER_EXTENSIONS` is also exported from this module. An extension from this group uses the metadata returned by the `ROUTES_EXTENSIONS` extension group to create HTTP request handlers.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples
[2]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/types/metadata-per-mod.ts#L58-L74
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.16.0/packages/body-parser/src/body-parser.extension.ts#L54
