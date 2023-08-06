---
sidebar_position: 4
---

# HTTP Interceptors

The interceptors are very similar in functionality to controllers, but they do not create routes, they are attached to existing routes. Multiple interceptors can work on a single route, launching one after another. Interceptors are analogous to [middleware in ExpressJS][5], but interceptors can use [DI][106]. Additionally, interceptors can work before and after the controller's operation. 

Given that interceptors do the same job that controllers can do, you can work without interceptors. But in this case, you will have to call various services in the controllers much more often.

Typically, interceptors are used to automate standard processing, such as:

- parsing the body of the request or headers;
- validation of the request;
- collecting and logging various application metrics;
- caching;
- etc.

Interceptors can be centrally connected or disconnected without changing the method code of the controllers to which they are attached.

## HTTP request processing scheme

HTTP request processing has the following workflow:

1. Ditsmod creates an instance of [PreRouter][7] at the application level.
2. `PreRouter` uses the router to search for the request handler according to the URI.
3. If the request handler is not found, `PreRouter` issues a 404 error.
4. If a request handler is found, Ditsmod creates a provider instance with the [HttpFrontend][2] token at the request level, places it first in the queue of interceptors, and automatically calls it. By default, this interceptor is responsible for calling guards and setting values for providers with `QUERY_PARAMS` and `PATH_PARAMS` tokens.
5. The second and subsequent interceptors may not start, depending on whether the previous interceptor in the queue will start them.
6. If all interceptors have worked, Ditsmod starts [HttpBackend][3], which is instantiated at the request level. By default, `HttpBackend` runs directly the controller method responsible for processing the current request.

So, the approximate order of processing the request is as follows:

```text
 request -> PreRouter -> HttpFrontend -> [other interceptors] -> HttpBackend -> [controller]
response <- PreRouter <- HttpFrontend <- [other interceptors] <- HttpBackend <- [controller]
```

As `PreRouter`, `HttpFrontend`, and `HttpBackend` instances are created using DI, you can replace them with your own version of the respective classes. For example, if you don't just want to send a 404 status when the required route is missing, but also want to add some text or change headers, you can substitute [PreRouter][7] with your own class.

Note that each call to the interceptor returns `Promise<any>`, and it eventually leads to a controller method tied to the corresponding route. This means that in the interceptor you can listen for the result of promise resolve, which returns the method of the controller. However, at the moment (Ditsmod v2.0.0), `HttpFrontend` and `HttpBackend` by default ignores everything that returns the controller or interceptors, so this promise resolve can be useful for other purposes - to collect metrics, logging, etc.

On the other hand, with DI you can easily replace `HttpFrontend` and `HttpBackend` with your own interceptors to take into account the return value of the controller method. One of the variants of this functionality is implemented in the [@ditsmod/return][104] module.

## Creating an interceptor

Each interceptor should be a class implementing the [HttpInterceptor][1] interface and annotated with the `injectable` decorator:

```ts
import { injectable } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  intercept(next: HttpHandler) {
    return next.handle(); // Here returns Promise<any>;
  }
}
```

As you can see, the `intercept()` method has a single parameter - this is the instance of the handler that calls the next interceptor. If the interceptor needs additional data for its work, it can be obtained in the constructor through DI, as in any service.

## Passing interceptor to the injector

Any interceptor is passed to the injector at the request level using [multi-providers][107] with the `HTTP_INTERCEPTORS` token:

```ts
import { HTTP_INTERCEPTORS, featureModule } from '@ditsmod/core';

import { MyHttpInterceptor } from './my-http-interceptor';

@featureModule({
  // ...
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class SomeModule {}
```

In this case, the interceptors are passed in the module's metadata. They can also be passed in the controller metadata. This means that interceptors can either work for all controllers in the module without exception, or only for a specific controller. If you only need to add interceptors to individual routes within controllers, you can do so with [extensions][108] (this is how [interceptors for parsing the request body][9] are added).

[1]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/types/http-interceptor.ts#L20-L22
[2]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/services/default-http-frontend.ts
[3]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/services/default-http-backend.ts
[5]: https://expressjs.com/en/guide/writing-middleware.html
[7]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/services/pre-router.ts
[8]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/types/route-data.ts
[9]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/body-parser/src/body-parser.extension.ts#L36

[104]: /native-modules/return
[106]: /components-of-ditsmod-app/dependency-injection
[107]: /components-of-ditsmod-app/dependency-injection#multi-providers
[108]: /components-of-ditsmod-app/extensions
