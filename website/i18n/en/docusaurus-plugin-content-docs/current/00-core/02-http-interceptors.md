# HTTP Interceptors

Interceptors are very close in functionality to controllers, but they do not create routes, they
are tied to existing routes. Each route can work a group of interceptors running one after another.

Given that interceptors do the same job that controllers can do, you can work without interceptors.
But in this case, at least, you will have to call different services in the controllers more often.

Typically, interceptors are used to automate standard processing, such as:

- parsing the body of the request, cookies, headers;
- validation of the request;
- verification of access rights;
- collecting and logging various application metrics.

Interceptors can be centrally connected or disconnected at the application, module, route, or
controller level without changing the method code of the controllers to which they are bound.

When the router transmits an HTTP request to the router handler, where there are interceptors, the
first interceptor in the chain is automatically started first. And the second and subsequent
interceptors may not start, it depends on whether the previous interceptor will start them in the
chain.

If all interceptors for a certain route have worked out, only then the corresponding method of the
controller is started.

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
handler that calls the next interceptor. If the interceptor needs certain data for the work, they
can be received in constructor through DI, as well as in any service.

Note that each call to the next interceptor returns `Promise<any>`, and it eventually leads to a
controller method tied to the corresponding route. This means that in the interceptor you can
listen for the result of promice resolve, which returns the method of the controller. However, at
the moment (v1.0.0), Ditsmod ignores everything that returns the controller or interceptors, so
this promise resolve can be useful for other purposes - to collect metrics, logging, etc.

## Declare interceptor level

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


[1]: ../api/http-interceptor