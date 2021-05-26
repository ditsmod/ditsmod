# HTTP Interceptors

Interceptors are very close in functionality to controllers, but they do not create routes, they
are tied to existing routes. Each route can work a group of interceptors running one after another.

Given that interceptors do the same job that controllers can do, you can work without interceptors.
But in this case, at least, you will have to call different services in the controllers more often.

Typically, interceptors are used to automate standard processing, such as:

- parsing the body of the request, cookies, headers;
- validation of the request;
- collecting and logging various application metrics.

Interceptors can be centrally connected or disconnected without changing the method code of the
controllers to which they are attached.

When HTTP request processing begins, Ditsmod first retrieves [HttpFrontend][2] via DI, puts it
first in the interceptor chain, and calls it automatically. By default, this interceptor is
responsible for calling guards, installing `req.pathParams` and `req.queryParams`, and for handling
errors that occur during the operation of interceptors and the controller.

The second and subsequent interceptors may not be called, depending on whether the previous one in
the chain interceptor will run them.

If all interceptors have worked, Ditsmod calls [HttpBackend][3], which is also extracted via DI. By
default, `HttpBackend` runs directly the controller method that is responsible for processing the
current request.

Therefore, the order of processing the request is as follows:

```text
HttpFrontend -> [other interceptors] -> HttpBackend -> [controller]
```

## Creating an interceptor

Each interceptor must be a class that implements the [HttpInterceptor][1] interface, and this class
must have an annotation with the `Injectable` decorator:

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

As you can see, the `intercept()` method gets a single argument - this is the instance of the
handler that calls the next interceptor. If the interceptor needs certain data for the work, it
can be received in constructor through DI, as well as in any service.

Note that each call to the next interceptor returns `Promise<any>`, and it eventually leads to a
controller method tied to the corresponding route. This means that in the interceptor you can
listen for the result of promice resolve, which returns the method of the controller.

However, at the moment (v1.0.0), `HttpFrontend` and `HttpBackend` ignores everything that returns
the controller or interceptors, so this promise resolve can be useful for other purposes - to
collect metrics, logging, etc.

On the other hand, through DI you can easily substitute `HttpFrontend` and `HttpBackend` with your
own interceptors to take into account the value returned by the controller method.

## Declare interceptor

Any interceptor is declared at the request level by multi-providers with the token
`HTTP_INTERCEPTORS`:

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
