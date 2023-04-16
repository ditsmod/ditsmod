---
sidebar_position: 1
---

# Router, controllers, and services

## What does a router do?

Right after Node.js receives an HTTP request and passes it to Ditsmod, the request URL is split into two parts separated by a question mark (if present). The first part always contains the so-called _path_, while the second part contains the _query parameters_, if the URL included a question mark.

The task of the router is to find the HTTP request handler by the _path_. After that, in most cases, the request handler calls the controller method.

# What is a controller?

A TypeScript class becomes a Ditsmod controller thanks to the controller decorator.

```ts
import { controller } from '@ditsmod/core';

@controller()
export class SomeController {}
```

It is recommended that controller files end with `*.controller.ts` and their class names end with `*Controller`.

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
2. In the class method, the parameter `res` is declared with the data type `Res`. So we ask Ditsmod to create an instance of `Res` and pass it to the appropriate variable. By the way, `res` is short for the word _response_.
3. Text responses to HTTP requests are sent via `res.send()`.

Although in the previous example, the `Res` instance was requested in DI through `method1()`, we can also request this instance in the constructor in a similar way:

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

## Binding of the controller to the module

The controller is bound to the module through the `controllers` array:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { SomeController } from './some.controller';

@featureModule({
  controllers: [SomeController]
})
export class SomeModule {}
```

After binding controllers to a module, in order for Ditsmod to take these controllers into account, the module should be either appended or imported in an object that has the [ModuleWithParams][2] interface. The following example shows both the appendage and the full import of the module (this is done only to demonstrate the possibility, in practice it does not make sense to do simultaneous appendage and import):

```ts {6-8}
import { featureModule } from '@ditsmod/core';

import { SomeModule } from './some.module';

@featureModule({
  appends: [SomeModule],
  // OR
  imports: [{ path: 'some-prefix', module: SomeModule }]
})
export class OtherModule {}
```

You can read more detailed information in the section [Export and import of modules][1].

## Services

Although from a technical point of view, it's possible to get by with just one controller to handle a HTTP request, it's better to separate the voluminous code with business logic into separate classes so that the code can be reused when needed and easier to test. These separate classes with business logic are usually called _services_.

What services can do:

- provide configuration;
- validate the request;
- parsing the request body;
- check access rights;
- work with databases, with mail;
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

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

As you can see, the rules for obtaining a class instance in the constructor are the same as in the controllers: using the `private` access modifier, we declare the `firstService` class property with the `FirstService` data type.

Please note that it is possible to request dependencies in the parameters of _methods_ services, but, firstly, above these methods you need to use any decorator for class properties (for example `@methodFactory()`), and secondly - these methods need to be used in providers with the [useFactory][3] property.


[1]: /components-of-ditsmod-app/exports-and-imports#import-module
[2]: /components-of-ditsmod-app/exports-and-imports#ModuleWithParams
[3]: /components-of-ditsmod-app/dependency-injection#provider
[4]: /components-of-ditsmod-app/dependency-injection#dependency-token
[5]: /native-modules/body-parser#usage
[6]: https://github.com/ditsmod/ditsmod/blob/core-2.38.1/packages/core/src/services/pre-router.ts
