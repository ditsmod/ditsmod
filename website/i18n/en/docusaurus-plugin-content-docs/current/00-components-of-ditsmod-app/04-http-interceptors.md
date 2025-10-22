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

Interceptors can be centrally enabled or disabled without modifying the code of the controller methods they are attached to. Like controllers, interceptors can operate in either [injector-scoped or context-scoped mode][109]. Unlike the context-scoped mode, in the injector-scoped mode, interceptors have access to the request-level injector, allowing them to invoke services at the request level. On the other hand, in the context-scoped mode, their instances are created at the route level, which grants them access to services at the route, module, or application level.

## HTTP request processing scheme {#http-request-processing-scheme}

### Injector-scoped mode {#injector-scoped-mode}

HTTP request processing has the following workflow:

1. Ditsmod creates an instance of [PreRouter][7] at the application level.
2. `PreRouter` uses the router to search for the request handler according to the URI.
3. If the request handler is not found, `PreRouter` issues a 501 error.
4. If a request handler is found, Ditsmod creates a provider instance with the [HttpFrontend][2] token at the request level, places it first in the queue of interceptors, and automatically calls it. By default, this interceptor is responsible for setting values for providers with `QUERY_PARAMS` and `PATH_PARAMS` tokens.
5. If there are guards in the current route, then by default `InterceptorWithGuards` is run immediately after `HttpFrontend`.
6. Other interceptors may be launched next, depending on whether the previous interceptor in the queue will launch them.
7. If all interceptors have worked, Ditsmod starts [HttpBackend][3], which is instantiated at the request level. By default, `HttpBackend` runs directly the controller method responsible for processing the current request.

So, the approximate order of processing the request is as follows:

1. `PreRouter`;
2. `HttpFrontend`;
3. `InterceptorWithGuards`;
4. other interceptors;
5. `HttpBackend`;
6. controller method.

Given that starting from `PreRouter` and to the controller method, a promise is passed, then the same promise will be resolved in the reverse order - from the controller method to `PreRouter`.

As `PreRouter`, `HttpFrontend`, `InterceptorWithGuards`, and `HttpBackend` instances are created using DI, you can replace them with your own version of the respective classes. For example, if you don't just want to send a 501 status when the required route is missing, but also want to add some text or change headers, you can substitute [PreRouter][7] with your own class.

Each call to the interceptor returns `Promise<any>`, and it eventually leads to a controller method tied to the corresponding route. This means that in the interceptor you can listen for the result of promise resolve, which returns the method of the controller.

### Context-scoped mode {#context-scoped-mode}

A context-scoped interceptor operates very similarly to an injector-scoped interceptor but does not utilize the request-level injector. The workflow involving it differs at points 4 and 7, as the instance of a context-scoped interceptor is created at the route level:

1. Ditsmod creates an instance of [PreRouter][7] at the application level.
2. `PreRouter` uses the router to search for the request handler according to the URI.
3. If the request handler is not found, `PreRouter` issues a 501 error.
4. If a request handler is found, Ditsmod uses a provider instance with the [HttpFrontend][2] token at the route level, places it first in the interceptor queue, and automatically invokes it. By default, this interceptor is responsible for setting `pathParams` and `queryParams` values for `RequestContext`.
5. If there are guards in the current route, then by default `InterceptorWithGuardsPerRou` is run immediately after `HttpFrontend`.
6. Other interceptors may be launched next, depending on whether the previous interceptor in the queue will launch them.
7. If all interceptors have worked, Ditsmod starts [HttpBackend][3], the instance of which is used at the route level. By default, `HttpBackend` runs directly the controller method responsible for processing the current request.

## Creating an interceptor {#creating-an-interceptor}

Each interceptor should be a class implementing the [HttpInterceptor][1] interface and annotated with the `injectable` decorator:

```ts
import { injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  intercept(next: HttpHandler, ctx: RequestContext) {
    return next.handle(); // Here returns Promise<any>;
  }
}
```

As you can see, the `intercept()` method has two parameters: the first is the handler instance that calls the next interceptor, and the second is `RequestContext` (native Node.js request and response objects). If the interceptor needs additional data for its work, it can be obtained in the constructor through DI, as in any service.

## Passing interceptor to the injector {#passing-interceptor-to-the-injector}

The interceptor for injector-scoped mode is passed to the injector at the request level using [multi-providers][107] with the `HTTP_INTERCEPTORS` token:

```ts
import { HTTP_INTERCEPTORS, restModule } from '@ditsmod/rest';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@restModule({
  // ...
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class SomeModule {}
```

Passing an interceptor for context-scoped mode happens in exactly the same way, but at the route, module, or application level:

```ts
import { HTTP_INTERCEPTORS, restModule } from '@ditsmod/rest';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@restModule({
  // ...
  providersPerRou: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class SomeModule {}
```

In this case, the interceptor is passed at the application level, but keep in mind that if you also pass interceptors at lower levels, this interceptor will be ignored. This is how [multi-providers][107] work.

In this case, the interceptors are passed in the module's metadata. They can also be passed in the controller metadata. This means that interceptors can either work for all controllers in the module without exception, or only for a specific controller. If you only need to add interceptors to individual routes within controllers, you can do so with [extensions][108] (this is how [interceptors for parsing the request body][9] are added).

[1]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/types/http-interceptor.ts#L43-L45
[2]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/interceptors/default-http-frontend.ts
[3]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/interceptors/default-http-backend.ts
[5]: https://expressjs.com/en/guide/writing-middleware.html
[7]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/services/pre-router.ts
[8]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/types/route-data.ts
[9]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.16.0/packages/body-parser/src/body-parser.extension.ts#L54

[106]: /components-of-ditsmod-app/dependency-injection
[107]: /components-of-ditsmod-app/dependency-injection#multi-providers
[108]: /components-of-ditsmod-app/extensions
[109]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
