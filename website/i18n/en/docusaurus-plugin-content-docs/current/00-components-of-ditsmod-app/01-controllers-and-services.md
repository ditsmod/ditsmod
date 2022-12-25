---
sidebar_position: 1
---

# Controllers and services

## What is a controller

The controllers are intended to receive HTTP requests and send HTTP responses. The TypeScript class becomes a Ditsmod controller with `Controller` decorator:

```ts
import { Controller } from '@ditsmod/core';

@Controller()
export class SomeController {}
```

It is recommended that files of controllers end with `*.controller.ts` and that their class names end with `*Controller`.

<!--
In general, you can transfer an object with the following properties to the `Controller` decorator:

```ts
import { Controller } from '@ditsmod/core';

@Controller({
  providersPerRou: [], // Route-level providers
  providersPerReq: [] // Request-level providers
})
export class SomeController {}
```
-->

The HTTP requests are tied to the methods of controllers through the routing system, using the decorator `Route`. The following example creates two routes that accept `GET` requests to `/hello` and `/throw-error`:

```ts
import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Res) {}

  @Route('GET', 'hello')
  tellHello() {
    this.res.send('Hello World!');
  }

  @Route('GET', 'throw-error')
  thrwoError() {
    throw new Error('Here some error occurred');
  }
}
```

What we see here:

1. In the constructor of the class using `private` access modifier, the property of class `res` with data type `Res` is declared. So we ask Ditsmod to create an instance of the `Res` class and pass it to the `res` variable. By the way, `res` is short for the word _response_.
2. Routes are created using the `Route` decorator, which is placed before the class method, and it does not matter what the name of this method is.
3. Text responses to HTTP requests are sent via `this.res.send()`.
4. Error objects can be thrown directly in the class method in the common way for JavaScript - with the keyword `throw`.

:::tip Use an access modifier
The access modifier in the constructor can be any (private, protected or public), but without the modifier - `res` will be a simple parameter with visibility only in the constructor.
:::

To use `pathParams`, `queryParams` or `body`, you should ask the `Req` in the controller constructor:

```ts
import { Controller, Req, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @Route('GET', 'hello/:userName')
  getHello() {
    const { pathParams } = this.req;
    this.res.send(`Hello, ${pathParams.userName}`);
  }

  @Route('POST', 'some-url')
  postSomeUrl() {
    const { body, queryParams } = this.req;
    this.res.sendJson(body, queryParams);
  }
}
```

By the way, `req` is short for _request_.

As you can see, to send responses with objects, you need to use the `this.res.sendJson()` method instead of `this.res.send()` (because it only sends text).

This example does not show, but remember that the native Node.js request object is in `this.req.nodeReq`.

### Binding of the controller to the module

The controller is bound to the module through an array of `controllers`:

```ts {6}
import { Module } from '@ditsmod/core';

import { SomeController } from './some.controller';

@Module({
  controllers: [SomeController]
})
export class SomeModule {}
```

After binding the controllers to the module, in order for Ditsmod to take these controllers into account, this module must be imported within an object with the `ModuleWithParams` interface:

```ts {7}
import { Module } from '@ditsmod/core';

import { SomeModule } from './some.module';

@Module({
  imports: [
    { path: '', module: SomeModule }
  ]
})
export class OtherModule {}
```

You can read more detailed information in the section [Export and import of modules][1].

## Services

Although from a technical point of view, it is possible to get by with just one controller to handle a HTTP request, but it is better to separate the voluminous code with business logic into separate classes so that this code can be reused if necessary, and easier to test. These separate classes with business logic are called _services_.

What services can do:

- provide configuration;
- validate the request;
- parsing the body of the request;
- check access permissions;
- works with databases, with emails:
- etc.

The TypeScript class becomes a Ditsmod service with `injectable` decorator:

```ts
import { injectable } from '@ts-stack/di';

@injectable()
export class SomeService {}
```

It is recommended that service file names end with `*.service.ts` and that their class names end with `*Service`.

Note that this decorator is imported from `@ts-stack/di`, not from `@ditsmod/core`.

Often some services depend on other services, and to get an instance of a particular service, you need specify its class in the constructor:

```ts
import { injectable } from '@ts-stack/di';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

As you can see, the rules for obtaining a class instance in the service are the same as in the controller. That is, we in the constructor with `private` access modifier declare property of class `firstService` with data type `FirstService`.

[1]: /components-of-ditsmod-app/exports-and-imports#import-module
