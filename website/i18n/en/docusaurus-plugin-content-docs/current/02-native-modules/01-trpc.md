---
sidebar_position: 1
---

# @ditsmod/trpc

The `@ditsmod/trpc` module provides integration with [@trpc/server][1]. A ready-made example of an application with `@ditsmod/trpc` can be [found in the Ditsmod repository][2]. There you can find examples of using guards and interceptors.

## Quick start

You can also use the monorepository, which contains minimal code for a quick start:

```bash
git clone --depth 1 https://github.com/ditsmod/trpc-monorepo-starter.git
```

## How client types are formed at the module level

Ditsmod strives to be transparent for `@trpc/client`, allowing TypeScript to infer types from static code without the need for additional compilation for the client. Each module that provides configuration for the tRPC router must do so in the `getRouterConfig()` method:

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

Here, `ModuleWithTrpcRoutes` is an interface that guarantees the presence of the `getRouterConfig()` method in the module.

In this example, the config is shown, based on which the following will be created:

1. the route `post.createPost`, which will be handled by the controller method - `PostController.prototype.createPost`;
2. the route group `post.comments`, which will be handled by the imported module - `CommentModule.prototype.getRouterConfig`. One can assume that `CommentModule` has its own `getRouterConfig()` method, where it specifies which controllers create certain routes.

Note that here the `PostRouter` type is created for the tRPC client. It is recommended to do this for each non-nested (!) module to mitigate [TypeScript performance issues][3] when it infers types from complex models. But remember that such types will not work correctly for nested modules. In this example, `CommentModule` is nested, so it is not advisable to create `export type CommentsRouter = RouterOf<typeof CommentsModule>` for it.

You can also centrally infer a single type for the merged tRPC router at the application level, but this is recommended only if you do not plan to create complex models that would cause TypeScript to “struggle” when analyzing them. To centrally infer a single router for the entire application, you should use `AppRouterHelper`:

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

  setAppRouter(): SetAppRouterOptions {
    return {
      basePath: '/trpc/',
    };
  }
}
```

Note that in `AppRouterHelper`, not just an array of imported modules is passed, but the array is also marked with `as const` — this is an important condition without which `AppRouterHelper` will not work correctly.

Also note the `TrpcRootModule` interface, which requires mandatory implementation of the `setAppRouter()` method, and optionally you can implement `setTrpcCreateOptions()`. When your `setAppRouter()` method returns a router config, you cannot pass the `createContext` option, because Ditsmod automatically creates the context as an object `{ req, res }` to guarantee availability of these variables in the context. Of course, in procedures you can add any other context properties.

## How client types are formed at the controller level

Each controller method that creates a route must have the `trpcRoute` decorator and must return a tRPC procedure:

```ts {8-10}
import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';
import { z } from 'zod';

@controller()
export class PostController {
  @trpcRoute()
  createPost(routeService: RouteService) {
    return routeService.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
      return { ...input, id: 1, body: 'post text' };
    });
  }
}
```

That is, if you only need to use the benefits of DI at the route level (and not at the HTTP request level), your code will differ little from native tRPC code. The only practical difference is that you must take the initial procedure from `RouteService`, as shown in this example. By the way, `RouteService` can specify the context and input type — `RouteService<SomeContext, SomeInput>`. Keep in mind that if you plan to write `routeService.procedure.input(...)`, you do not need to pass the second generic, because input types will conflict. The second generic makes sense if validation is done automatically in interceptors, and not directly in the route code.

In addition to `RouteService`, you can request any other service at the route level in the controller method parameters, and the order of parameters does not matter:

```ts {4}
@controller()
export class PostController {
  @trpcRoute()
  createPost(service1: Service1, service2: Service2, routeService: RouteService) {
    // ...
  }
}
```

If you need to use guards or interceptors, you just need to add them to the first and second arrays in the `trpcRoute` decorator, respectively:

```ts {9}
import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';
import { z } from 'zod';

import { BearerGuard } from '../auth/bearer.guard.js';
import { MyInterceptor } from './my.interceptor.js';

@controller()
export class PostController {
  @trpcRoute([BearerGuard], [MyInterceptor])
  createPost(routeService: RouteService) {
    return routeService.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
      return { ...input, id: 1, body: 'post text' };
    });
  }
}
```

## How to use router types on the client

As mentioned above, to mitigate [TypeScript performance issues][3], it is recommended to infer the type for each non-nested (!) module. A "non-nested module" means a module that is directly imported into the root module. Therefore, when creating a client, it is recommended to use a generic type for the router — `createTRPCClient<AnyTRPCRouter>()`, and then refine the type for each specific module:

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
