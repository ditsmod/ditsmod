---
sidebar_position: 4
---

# HTTP Interceptors

Interceptors are very close in functionality to controllers, but they do not create routes, they are tied to existing routes. Each route can work a group of interceptors running one after another. Interceptors are analogous to [middleware in ExpressJS][5], but interceptors can use [DI][6]. In addition, interceptors can work both before and after the operation of the controller.

Given that interceptors do the same job that controllers can do, you can work without interceptors. But in this case, you will have to call various services in the controllers much more often.

Typically, interceptors are used to automate standard processing, such as:

- parsing the body of the request, cookies, headers;
- validation of the request;
- collecting and logging various application metrics.

Interceptors can be centrally connected or disconnected without changing the method code of the controllers to which they are attached.

## HTTP request processing scheme

HTTP request processing has the following workflow:

1. Ditsmod extracted [PreRouter][7] via [DI][6] (at the application level).
2. `PreRouter` uses the router to search for the request handler according to the URI.
3. If the request handler is not found, `PreRouter` issues a 404 error.
4. If a request handler is found, Ditsmod extracted [HttpFrontend][2] via DI, puts it first in the interceptor queue, and calls it automatically. By default, this interceptor is responsible for calling guards, setting `req.pathParams` and `req.queryParams`, as well as handling errors that occur during the operation of interceptors and the controller.
5. The second and subsequent interceptors may not start, it depends on whether the previous interceptor in the queue will start them.
6. If all interceptors have worked, Ditsmod runs [HttpBackend][3], which is also extracted via DI. By default, `HttpBackend` runs directly the controller method responsible for processing the current request.

So, the approximate order of processing the request is as follows:

```text
request -> PreRouter (create Promise) -> HttpFrontend -> [other interceptors] -> HttpBackend -> [controller]
response <- PreRouter (resolved Promise) <- HttpFrontend <- [other interceptors] <- HttpBackend <- [controller]
```

Since `PreRouter`, `HttpFrontend` and `HttpBackend` are extracted via DI, you can substitute them with your version of the respective classes. For example, if you don't just want to send a 404 status when the required route is missing, but also want to add some text or change headers, you can substitute `PreRouter` with your own class.

## Creating an interceptor

Each interceptor must be a class implementing the [HttpInterceptor][1] interface and annotated with the `Injectable` decorator:

```ts
import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor } from '@ditsmod/core';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  intercept(next: HttpHandler) {
    return next.handle(); // Here returns Promise<any>;
  }
}
```

As you can see, the `intercept()` method gets a single argument - this is the instance of the handler that calls the next interceptor. If the interceptor needs certain data for the work, it can be received in constructor through DI, as well as in any service.

Note that each call to the interceptor returns `Promise<any>`, and it eventually leads to a controller method tied to the corresponding route. This means that in the interceptor you can listen for the result of promice resolve, which returns the method of the controller. However, at the moment (Ditsmod v2.0.0), `HttpFrontend` and `HttpBackend` by default ignores everything that returns the controller or interceptors, so this promise resolve can be useful for other purposes - to collect metrics, logging, etc.

On the other hand, with DI you can easily replace `HttpFrontend` and `HttpBackend` with your own interceptors to take into account the return value of the controller method. One of the variants of this functionality is implemented in the [@ditsmod/return][4] module.

## Passing interceptor to injector

Any interceptor is passing to the injector at the request level by multi-providers with the token `HTTP_INTERCEPTORS`:

```ts
import { HTTP_INTERCEPTORS, Module } from '@ditsmod/core';

import { MyHttpInterceptor } from './my-http-interceptor';

@Module({
  // ...
  providersPerReq: [{ provide: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class SomeModule {}
```

[1]: https://github.com/ditsmod/ditsmod/blob/core-1.0.0/packages/core/src/types/http-interceptor.ts#L9-L11
[2]: https://github.com/ditsmod/ditsmod/blob/core-1.0.0/packages/core/src/types/http-interceptor.ts#L18-L20
[3]: https://github.com/ditsmod/ditsmod/blob/core-1.0.0/packages/core/src/types/http-interceptor.ts#L41-L43
[4]: ../02-published-modules/05-return.md
[5]: https://expressjs.com/en/guide/writing-middleware.html
[6]: ./02-dependency-injection.md
[7]: https://github.com/ditsmod/ditsmod/blob/router-2.3.0/packages/core/src/services/pre-router.ts
