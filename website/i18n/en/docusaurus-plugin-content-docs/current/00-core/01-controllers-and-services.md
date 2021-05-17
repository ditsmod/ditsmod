---
sidebar_position: 1
---

# Controllers and services

## What is a controller

The controllers are intended to receive HTTP requests and send HTTP responses. The TypeScript class
becomes a Ditsmod controller with `Controller` decorator:

```ts
import { Controller } from '@ditsmod/core';

@Controller()
export class SomeController {}
```

The requests are tied to the methods of controllers through the routing system, using the decorator
`Route`. The following example creates two routes that accept `GET` requests to `/hello` and
`/throw-error`:

```ts
import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

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

1. In the constructor of the class using the access modifier `private` the property of class `res`
with data type `Response` is declared. So we ask Ditsmod to create an instance of the `Response`
class and pass it to the `res` variable.
2. Routes are created using the `Route` decorator, which is placed before the class method.
3. Responses to HTTP requests are sent via `this.res.send()`.
4. Error objects can be thrown directly in the class method in the usual way for JavaScript - with
the keyword `throw`.

:::tip Use an access modifier
The access modifier in the constructor can be any (private, protected or public), but without the
modifier - `res` will be a simple parameter with visibility only in the constructor.
:::

:::caution Don't forget to import Request and Response
If you specify the `Request` or `Response` class in the constructor, don't forget to import them
from _@ditsmod/core_! If you don't, your application will stop working, although the IDE may not tell
you that you don't have these classes imported.

The fact is that in TypeScript globally announced interfaces with exactly the same names - `Request`
and `Response`. Because of this, your IDE can only say that these interfaces do not have certain
properties that classes imported from _@ditsmod/core_ should have.
:::

### Declare the controller

You can declare a controller in any module, in the `controllers` array:

```ts
import { Module } from '@ditsmod/core';

import { SomeController } from './first.controller';

@Module({
  controllers: [SomeController]
})
export class SomeModule {}
```

To use `pathParams`, `queryParams` or `body`, you should ask the `Request` in the controller
constructor:

```ts
import { Controller, Request, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Request, private res: Response) {}

  @Route('GET', 'hello/:userName')
  tellHello() {
    const { pathParams } = this.req;
    this.res.send(`Hello, ${pathParams.userName}`);
  }

  @Route('POST', 'some-url')
  tellHello() {
    const { body, queryParams } = this.req;
    this.res.sendJson(body, queryParams);
  }
}
```

In constructor we received instances of classes `Request` and `Response`,
they represent services.

## Sevices

The TypeScript class becomes a Ditsmod service with `Injectable` decorator:

```ts
import { Injectable } from '@ts-stack/di';

@Injectable()
export class SomeService {}
```

Note that this decorator is imported from `@ts-stack/di`, not from `@ditsmod/core`.
Examples of Ditsmod services:

- configuration service;
- service for working with databases, mail, etc .;
- service for parsing the body of the HTTP-request;
- service for checking access rights;
- etc.

Often some services depend on other services, and to get an instance of a particular service, you
need specify their classes in the constructor:

```ts
import { Injectable } from '@ts-stack/di';

import { FirstService } from './first.service';

@Injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

As you can see, the rules for obtaining a class instance in the service are the same as in the
controller. That is, we in the constructor with the access modifier `private` declare property of
class `firstService` with data type `FirstService`. Instances in constructor are created by [DI][8].


[8]: https://en.wikipedia.org/wiki/Dependency_injection
