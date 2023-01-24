---
sidebar_position: 1
---

# Controllers and services

## What is a controller

Controllers are designed to receive HTTP requests and send HTTP responses. A TypeScript class becomes a Ditsmod controller thanks to the `controller` decorator:

```ts
import { controller } from '@ditsmod/core';

@controller()
export class SomeController {}
```

It is recommended that controller files end with `*.controller.ts` and their class names end with `*Controller`.

<!--
Загалом, в декоратор `controller` можна передавати об'єкт із такими властивостями:

```ts
import { controller } from '@ditsmod/core';

@controller({
  providersPerRou: [], // Провайдери на рівні роута
  providersPerReq: [] // Провайдери на рівні запиту
})
export class SomeController {}
```
-->

HTTP requests are bound to controller methods through the routing system, using the `route` decorator. In the following example, a single route is created that accepts `GET` request at `/hello`:

```ts
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

Although in the previous example the instance of `Res` was requested in `method1()`, we can similarly use the constructor:

```ts
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

You can get `pathParams` or `queryParams` in the following way:

```ts
import { controller, Res, route, inject, AnyObj, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('POST', 'some-url')
  postSomeUrl(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj
    res: Res
  ) {
    res.sendJson(pathParams, queryParams);
  }
}
```

As you can see, to send responses with objects, you need to use the `res.sendJson()` method instead of `res.send()` (because it only sends text).

The native Node.js request and response object can be obtained by tokens, respectively - `NODE_REQ` and `NODE_RES`:

```ts
import { controller, route, inject, NODE_REQ, NODE_RES, NodeRequest, NodeResponse } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse,
  ) {}

  @route('GET', 'hello')
  method1() {
    this.nodeRes.end('Hello World!');
  }
}
```

More information about tokens and the `inject` decorator can be found in [Dependency Injection][4]. You may also be interested in [how to get the HTTP request body][5].

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

After binding controllers to a module, in order for Ditsmod to take these controllers into account, the module should be either attached or imported in an object that has the [ModuleWithParams][2] interface. The following example shows both the attachment and the full import of the module (this is done only to demonstrate the possibility, in practice it does not make sense to do simultaneous attachment and import):

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

```ts
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
