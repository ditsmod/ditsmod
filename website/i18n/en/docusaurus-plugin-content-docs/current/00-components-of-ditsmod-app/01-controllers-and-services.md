---
sidebar_position: 1
---

# Router, controllers and services

## What does a router do?

The router has a mapping between the URL and the HTTP request handler. Although you will not have to manually write this mapping, but for a general idea of how the router works, in a very simplified form, this mapping can be imagined as follows:

```ts
const routes = new Map<string, Function>();
routes.set('/one', function() { /** request processing... **/ });
routes.set('/two', function() { /** request processing... **/ });
routes.set('/three', function() { /** request processing... **/ });
// ...
```

Right after Node.js receives an HTTP request and passes it to Ditsmod, the request URL is split into two parts separated by a question mark (if present). The first part always contains the so-called _path_, while the second part contains the _query parameters_, if the URL included a question mark.

The router's task is to find the HTTP request handler by _path_. In a very simplified form, this process can be imagined as follows:

```ts
const path = '/two';
const handle = routes.get(path);
handle();
```

In most cases, the request handler calls the controller method.

## What is a controller

The mapping between the URL and the request handler is formed on the basis of the controllers, or rather - on the basis of the methods of the controllers. A TypeScript class becomes a Ditsmod controller thanks to the `controller` decorator:

```ts
import { controller } from '@ditsmod/core';

@controller()
export class SomeController {}
```

It is recommended that controller files end with `*.controller.ts` and their class names end with `*Controller`.

Starting with v2.50.0, Ditsmod makes it possible to work with the controller in two modes:

1. The controller is non-singleton (by default). Its instance is created for each request.
2. Controller is singleton. Its instance is created only once during application initialization.

The first mode is safer when you need to work in the context of the current request (the client provides a certain identifier that must be taken into account to form a response). The second mode is noticeably faster and consumes less memory, but the request context cannot be stored in the properties of the controller instance, because this instance can be used for other clients at the same time. In the second mode, the request context will have to be passed only as an argument to the methods.

In order for Ditsmod to work with the controller as a singleton, `{ isSingleton: true }` must be specified in the metadata:

```ts
import { controller } from '@ditsmod/core';

@controller({ isSingleton: true })
export class SomeController {}
```

### The controller non-singleton

As mentioned above, after the router finds the HTTP request handler, this handler can call the controller method. To make this possible, HTTP requests are first bound to controller methods through a routing system using the `route` decorator. In the following example, a single route is created that accepts a `GET` request at the address `/hello`:

```ts {5}
import { controller, route, Res } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  method1(res: Res) {
    res.send('Hello World!');
  }
}
```

What we see here:

1. The route is created using the `route` decorator, which is placed in front of the class method, and it does not matter what the name of this method is.
2. In the class method, the parameter `res` is declared with the data type `Res`. So we ask Ditsmod to create an instance of the `Res` class and pass it to the corresponding variable. By the way, `res` is short for the word _response_.
3. Text responses to HTTP requests are sent via `res.send()`.

Although in the previous example, an instance of the `Res` class was requested through `method1()`, we can similarly request this instance in the constructor:

```ts {5}
import { controller, route, Res } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET', 'hello')
  method1() {
    this.res.send('Hello World!');
  }
}
```

Of course, other instances of classes can be requested in the parameters, and the order of the parameters is not important.

:::tip Use the access modifier
The access modifier in the constructor can be any (private, protected or public), but without a modifier - `res` will be just a simple parameter with visibility only in the constructor.
:::

To obtain `pathParams` or `queryParams`, we need to use the `inject` decorator and the `PATH_PARAMS` and `QUERY_PARAMS` tokens:

```ts {7-8}
import { controller, Res, route, inject, AnyObj, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('POST', 'some-url/:param1/:param2')
  postSomeUrl(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj,
    res: Res
  ) {
    res.sendJson(pathParams, queryParams);
  }
}
```

You can find more information about what a token is and what the `inject` decorator does in the [Dependency Injection][4] section.

As you can see from the previous example, to send responses with objects, you need to use the `res.sendJson()` method instead of `res.send()` (which only sends text).

Native Node.js request and response objects can be obtained by tokens, respectively - `NODE_REQ` and `NODE_RES`:

```ts {6-7}
import { controller, route, inject, NODE_REQ, NODE_RES, NodeRequest, NodeResponse } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse
  ) {}

  @route('GET', 'hello')
  method1() {
    this.nodeRes.end('Hello World!');
  }
}
```

You may also be interested in [how to get the HTTP request body][5].

### The controller singleton

Because the controller is instantiated in this mode only once, you will not be able to query in its constructor for class instances that are instantiated on each request. For example, if you request an instance of the `Res` class in the constructor, Ditsmod will throw an error:

```ts {3,5}
import { controller, route, Res } from '@ditsmod/core';

@controller({ isSingleton: true })
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET', 'hello')
  method1() {
    this.res.send('Hello World!');
  }
}
```

The working case will be as follows:

```ts {3,6}
import { controller, route, RequestContext } from '@ditsmod/core';

@controller({ isSingleton: true })
export class HelloWorldController {
  @route('GET', 'hello')
  method1(ctx: RequestContext) {
    ctx.nodeRes.setHeader('Content-Type', 'text/plain; charset=utf-8');
    ctx.nodeRes.end('Hello, World!');
  }
}
```

In the "controller singleton" mode, controller methods bound to specific routes receive a single argument - the request context. That is, in this mode, you will no longer be able to ask Ditsmod to pass instances of other classes to these methods. However, in the constructor you can still request instances of certain classes that are created only once.

## Binding of the controller to the module

The controller is bound to the module through the `controllers` array:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController]
})
export class SomeModule {}
```

After binding controllers to a module, in order for Ditsmod to take these controllers into account, the module should be either appended or imported in an object that has the [ModuleWithParams][2] interface. The following example shows both the appendage and the full import of the module (this is done only to demonstrate the possibility, in practice it does not make sense to do simultaneous appendage and import):

```ts {6-8}
import { featureModule } from '@ditsmod/core';

import { SomeModule } from './some.module.js';

@featureModule({
  appends: [SomeModule],
  // OR
  imports: [{ path: 'some-prefix', module: SomeModule }]
})
export class OtherModule {}
```

You can read more detailed information in the section [Export, import and appends of modules][1].

## Services

Although from a technical point of view, it's possible to get by with just one controller to handle an HTTP request, it's better to separate the voluminous code with business logic into separate classes so that the code can be reused when needed and easier to test. These separate classes with business logic are usually called _services_.

What services can do:

- provide configuration;
- validate the request;
- parsing the request body;
- check access rights;
- work with databases, with email;
- etc.

The TypeScript class becomes a Ditsmod service with `injectable` decorator:

```ts
import { injectable } from '@ditsmod/core';

@injectable()
export class SomeService {}
```

It is recommended that service files end with `*.service.ts`, and their classes end with `*Service`.

Often, some services depend on other services, and to get an instance of a certain service, you need to specify its class in the constructor:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

As you can see, the rules for getting a class instance in the constructor are the same as in controllers: using the `private` access modifier, we declare a property of the `firstService` class with the `FirstService` data type.

To be able to use the newly created service classes, they must be passed in the metadata of the **current** module or controller. You can pass the service in the module metadata as follows:

```ts {6}
import { featureModule } from '@ditsmod/core';
import { SomeService } from './some.service.js';

@featureModule({
  providersPerReq: [
    SomeService
  ],
})
export class SomeModule {}
```

Similarly, the service is passed in the controller metadata:

```ts {6}
import { controller, route, Res } from '@ditsmod/core';
import { SomeService } from './some.service.js';

@controller({
  providersPerReq: [
    SomeService
  ],
})
export class SomeController {
  @route('GET', 'hello')
  method1(res: Res, someService: SomeService) {
    res.send(someService.sayHello());
  }
}
```

In the last two examples, the service is passed to the `providersPerReq` array, but this is not the only way to pass services. For more information about the rules of working with DI, see [Dependency Injection][7].

[1]: /developer-guides/exports-and-imports#import-module
[2]: /developer-guides/exports-and-imports#ModuleWithParams
[3]: /components-of-ditsmod-app/dependency-injection#providers
[4]: /components-of-ditsmod-app/dependency-injection#dependency-token
[5]: /native-modules/body-parser#usage
[6]: https://github.com/ditsmod/ditsmod/blob/core-2.49.0/packages/core/src/services/pre-router.ts
[7]: /components-of-ditsmod-app/dependency-injection
