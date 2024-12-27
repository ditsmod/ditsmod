---
sidebar_position: 1
---

# Router, controllers and services

## What does a router do? {#what-does-a-router-do}

A router maps URLs to the appropriate request handler. For example, when users request URLs like `/some-path`, `/other-path`, or `/path-with/:parameter` from their browser, they are informing the Ditsmod application that they want to access a specific resource or perform an action on the website. To enable the Ditsmod application to respond appropriately in these cases, you need to define the corresponding request handlers in the code. So, if `/some-path` is requested, a specific function is executed; if `/other-path` is requested, a different function is triggered, and so on. This process of defining the relationship between a URL and its handler is known as URL-to-handler mapping.

Although you won't have to manually write this mapping, for a general understanding of how a router works, it can be simplified like this:

```ts
const routes = new Map<string, Function>();
routes.set('/some-path', function() { /** request handling... **/ });
routes.set('/other-path', function() { /** request handling... **/ });
routes.set('/path-with/:parameter', function() { /** request handling... **/ });
// ...
```

Right after Node.js receives an HTTP request and passes it to Ditsmod, the request URL is split into two parts separated by a question mark (if present). The first part always contains the so-called _path_, while the second part contains the _query parameters_, if the URL included a question mark.

The router's task is to find the HTTP request handler by _path_. In a very simplified form, this process can be imagined as follows:

```ts
const path = '/some-path';
const handle = routes.get(path);

// ...
// And then this handler is called in a function that listens for HTTP requests.
if (handle) {
  handle();
}
```

In most cases, the request handler calls the controller method.

## What is a controller {#what-is-a-controller}

The mapping between the URL and the request handler is based on the metadata attached to the controller methods. A TypeScript class becomes a Ditsmod controller thanks to the `controller` decorator:

```ts
import { controller } from '@ditsmod/core';

@controller()
export class SomeController {}
```

It is recommended that controller files end with `*.controller.ts` and their class names end with `*Controller`.

Ditsmod supports two alternative modes of operation for controllers:

1. **Injector-scoped controller** (default). The HTTP request is obtained from DI injector.
2. **Context-scoped controller**. The HTTP request (along with other contextual data) is passed as an argument to the class method.

The first mode is more convenient and safer when working within the context of the current HTTP request (e.g., when the client provides a specific identifier that must be considered when forming the response). The second mode is noticeably faster (approximately 15–20%) and consumes less memory, but the request context cannot be stored in the instance properties of the controller, as this instance may be used simultaneously for other clients.

To make a controller operate in the context-scoped mode, you need to specify `{ scope: 'ctx' }` in its metadata:

```ts
import { controller } from '@ditsmod/core';

@controller({ scope: 'ctx' })
export class SomeController {}
```

### Injector-scoped controller {#injector-scoped-controller}

As mentioned above, after the router finds the HTTP request handler, this handler can call the controller method. To make this possible, HTTP requests are first bound to controller methods through a routing system using the `route` decorator. In the following example, a single route is created that accepts a `GET` request at the path `/hello`:

```ts {6}
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  method1(res: Res) {
    res.send('Hello, World!');
  }
}
```

What we see here:

1. The route is created using the `route` decorator, which is placed in front of the class method, and it does not matter what the name of this method is.
2. In the class method, the parameter `res` is declared with the data type `Res`. So we ask Ditsmod to create an instance of the `Res` class and pass it to the corresponding variable. By the way, `res` is short for the word _response_.
3. Text responses to HTTP requests are sent via `res.send()`.

Although in the previous example, an instance of the `Res` class was requested through `method1`, we can similarly request this instance in the constructor:

```ts {6}
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET', 'hello')
  method1() {
    this.res.send('Hello, World!');
  }
}
```

Of course, other instances of classes can be requested in the parameters, and the order of the parameters is not important.

:::tip Use the access modifier
The access modifier in the constructor can be any (private, protected or public), but without a modifier - `res` will be just a simple parameter with visibility only in the constructor.
:::

To obtain `pathParams` or `queryParams`, you need to use the `inject` decorator and the `PATH_PARAMS` and `QUERY_PARAMS` tokens:

```ts {8-9}
import { controller, Res, inject, AnyObj, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class SomeController {
  @route('GET', 'some-url/:param1/:param2')
  method1(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj,
    res: Res
  ) {
    res.sendJson({ pathParams, queryParams });
  }
}
```

You can find more information about what a token is and what the `inject` decorator does in the [Dependency Injection][4] section.

As you can see from the previous example, to send responses with objects, you need to use the `res.sendJson()` method instead of `res.send()` (which only sends text).

Native Node.js request and response objects can be obtained by tokens, respectively - `RAW_REQ` and `RAW_RES`:

```ts {7-8}
import { controller, inject, RAW_REQ, RAW_RES, RawRequest, RawResponse } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  constructor(
    @inject(RAW_REQ) private rawReq: RawRequest,
    @inject(RAW_RES) private rawRes: RawResponse
  ) {}

  @route('GET', 'hello')
  method1() {
    this.rawRes.end('Hello, World!');
  }
}
```

You may also be interested in [how to get the HTTP request body][5].

### Context-scoped controller {#context-scoped-controller}

Because the controller is instantiated in this mode only once, you will not be able to query in its constructor for class instances that are instantiated on each request. For example, if you request an instance of the `Res` class in the constructor, Ditsmod will throw an error:

```ts {4,6}
import { controller, RequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller({ scope: 'ctx' })
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET', 'hello')
  method1() {
    this.res.send('Hello, World!');
  }
}
```

The working case will be as follows:

```ts {4,7}
import { controller, RequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller({ scope: 'ctx' })
export class HelloWorldController {
  @route('GET', 'hello')
  method1(ctx: RequestContext) {
    ctx.send('Hello, World!');
  }
}
```

In the "context-scoped" mode, controller methods bound to specific routes receive a single argument - the request context. That is, in this mode, you will no longer be able to ask Ditsmod to pass instances of other classes to these methods. However, in the constructor you can still request instances of certain classes that are created only once.

## Binding of the controller to the module

The controller is bound to the module through the `controllers` array:

```ts {5}
import { featureModule } from '@ditsmod/core';
import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController]
})
export class SomeModule {}
```

After binding controllers to a module, in order for Ditsmod to take these controllers into account, the module should be either appended or imported as an object that has the [ModuleWithParams][2] interface. The following example shows both the appending and the full import of the module (this is just to demonstrate the possibility, in practice it does not make sense to append and import at the same time):

```ts {5-7}
import { featureModule } from '@ditsmod/core';
import { SomeModule } from './some.module.js';

@featureModule({
  appends: [SomeModule],
  // OR
  imports: [{ path: 'some-prefix', module: SomeModule }]
})
export class OtherModule {}
```

If the module is imported without the `path` property, Ditsmod will only import [providers][3] and [extensions][9] from it:

```ts {5}
import { featureModule } from '@ditsmod/core';
import { SomeModule } from './some.module.js';

@featureModule({
  imports: [SomeModule]
})
export class OtherModule {}
```

You can read more detailed information in the section [Export, import and appends of modules][1].

## Services

While it's technically possible to get by with just one controller to handle an HTTP request, it's better to separate the extensive business logic code into separate classes so that the code can be reused as needed and is easier to test. These separate classes with business logic are usually called _services_.

What services can do:

- provide configuration;
- validate the request;
- parsing the request body;
- check access rights;
- work with databases, with email;
- etc.

Any TypeScript class can be a Ditsmod service, but if you want [DI][7] to resolve the dependency you specify in the constructors of these classes, you must specify the `injectable` decorator before them:

```ts {4,6}
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

It is recommended that service files end with `*.service.ts`, and their classes end with `*Service`.

As you can see, the rules for getting a class instance in the constructor are the same as in controllers: using the `private` access modifier, we declare a property of the `firstService` class with the `FirstService` data type.

To be able to use the newly created service classes, they must be passed in the metadata of the **current** module or controller. You can pass the services in the module metadata as follows:

```ts {7-8}
import { featureModule } from '@ditsmod/core';
import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';

@featureModule({
  providersPerReq: [
    FirstService,
    SecondService
  ],
})
export class SomeModule {}
```

Similarly, the services is passed in the controller metadata:

```ts {9-10}
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';

@controller({
  providersPerReq: [
    FirstService,
    SecondService
  ],
})
export class SomeController {
  @route('GET', 'hello')
  method1(res: Res, secondService: SecondService) {
    res.send(secondService.sayHello());
  }
}
```

In the last two examples, the services is passed to the `providersPerReq` array, but this is not the only way to pass services. For more information about the rules of working with DI, see [Dependency Injection][7].

[1]: /developer-guides/exports-and-imports#import-module
[2]: /developer-guides/exports-and-imports#ModuleWithParams
[3]: /components-of-ditsmod-app/dependency-injection#providers
[4]: /components-of-ditsmod-app/dependency-injection#dependency-token
[5]: /native-modules/body-parser#retrieving-the-request-body
[6]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/services/pre-router.ts
[7]: /components-of-ditsmod-app/dependency-injection
[9]: /components-of-ditsmod-app/extensions/
