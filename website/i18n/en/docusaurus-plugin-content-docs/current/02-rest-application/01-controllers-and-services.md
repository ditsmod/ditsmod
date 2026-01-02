---
sidebar_position: 1
---

# Router, controllers and services

## What does a REST router do? {#what-does-a-rest-router-do}

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

## What is a REST controller {#what-is-a-rest-controller}

The mapping between the URL and the request handler is based on the metadata attached to the controller methods. A TypeScript class becomes a Ditsmod controller thanks to the `controller` decorator:

```ts {3}
import { controller, route } from '@ditsmod/rest';

@controller()
export class SomeController {
  @route('GET', 'hello')
  method1() {
    // ...
  }
}
```

It is recommended that controller files end with `*.controller.ts` and their class names end with `*Controller`.

As can be seen from the previous example, any REST controller must have:

1. A class method that will be invoked during an HTTP request.
2. The HTTP method name (`GET`, `POST`, `PATCH`, etc.).
3. The URL to which the class method call will be bound (optionally).

The combination of the second and third points must be unique across the entire application. In other words, if you define that `GET` + `/hello` is bound to a specific controller method, this combination must not be reused. Otherwise, the `@ditsmod/rest` module will throw an error with an appropriate message.

Ditsmod provides controllers in two alternative modes, which differ in the mechanism for passing arguments to the controller method:

1. **Injector-scoped controller** (default). A controller method can receive any number of arguments from the [DI injector][3]. These arguments can include an HTTP request.
2. **Context-scoped controller**. The controller method receives a single argument - the request context, which includes the HTTP request.

The first mode is more convenient and safer when working within the context of the current HTTP request (e.g., when the client provides a specific identifier that must be considered when forming the response). The second mode is noticeably faster (approximately 15–20%) and consumes less memory, but the request context cannot be stored in the instance properties of the controller, as this instance may be used simultaneously for other clients.

### Injector-scoped controller {#injector-scoped-controller}

By default, Ditsmod works with the controller in injector-scoped mode. This means, first, that a separate controller instance will be created for each HTTP request. Second, any controller method that has a `route` decorator will receive an arbitrary number of arguments from the [DI injector][3]. The following example creates a single route that accepts a `GET` request at `/hello`:

```ts {7}
import { controller, route, Res } from '@ditsmod/rest';
import { Service1 } from './service-1';
import { Service2 } from './service-2';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  method1(service1: Service1, service2: Service2, res: Res) {
    // Working with service1 and service2
    // ...
    res.send('Hello, World!');
  }
}
```

What we see here:

1. A route is created using the `route` decorator, which is placed before a class method, and the method's name doesn't matter.
2. In this controller mode, you can declare any number of parameters in a class method. In this case, we declared three dependencies: `service1` with data type `Service1`, `service2` with data type `Service2`, and `res` with data type `Res`. By the way, `res` is short for the word _response_.
3. Text responses to HTTP requests are sent using `res.send()`.

Although in the previous example the dependencies were declared in `method1`, we can do this in a similar way in the constructor:

```ts {7}
import { controller, Res, route } from '@ditsmod/rest';
import { Service1 } from './service-1';
import { Service2 } from './service-2';

@controller()
export class HelloWorldController {
  constructor(private service1: Service1, private service2: Service2, private res: Res) {}

  @route('GET', 'hello')
  method1() {
    // Working with this.service1 and this.service2
    // ...
    this.res.send('Hello, World!');
  }
}
```

Of course, other dependencies can be declared in method parameters, and the sequence of parameters is unimportant.

:::tip Use the access modifier
The access modifier in the constructor can be any of the following: `private`, `protected`, or `public`. However, if no modifier is specified, the parameters will only be visible within the constructor (they will not be accessible in the methods).
:::

#### Routing parameters {#routing-parameters}

To pass path parameters to the router, you need to use a colon before the parameter name. For example, the URL `some-url/:param1/:param2` includes two path parameters. If you are using the `@ditsmod/rest` module for routing, only path parameters determine the routes, while query parameters are not taken into account.

To access path or query parameters, you need to use the `inject` decorator along with the `PATH_PARAMS` and `QUERY_PARAMS` tokens:

```ts {8-9}
import { inject, AnyObj } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/rest';

@controller()
export class SomeController {
  @route('GET', 'some-url/:param1/:param2')
  method1(
    @inject(PATH_PARAMS) pathParams: AnyObj,
    @inject(QUERY_PARAMS) queryParams: AnyObj
  ) {
    return ({ pathParams, queryParams });
  }
}
```

You can find more information about what a token is and what the `inject` decorator does in the [Dependency Injection][3] section.

As you can see from the previous example, responses to HTTP requests can also be sent using the regular `return`.

Native Node.js request and response objects can be obtained by tokens, respectively - `RAW_REQ` and `RAW_RES`:

```ts {7-8}
import { inject } from '@ditsmod/core';
import { controller, route, RAW_REQ, RAW_RES, RawRequest, RawResponse } from '@ditsmod/rest';

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

To make a controller operate in the context-scoped mode, you need to specify `{ scope: 'ctx' }` in its metadata. Because the controller is instantiated in this mode only once, you will not be able to query in its constructor for class instances that are instantiated on each request. For example, if you request an instance of the `Res` class in the constructor, Ditsmod will throw an error:

```ts {3,5}
import { RequestContext, controller, route } from '@ditsmod/rest';

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

```ts {3,6}
import { controller, RequestContext, route } from '@ditsmod/rest';

@controller({ scope: 'ctx' })
export class HelloWorldController {
  @route('GET', 'hello')
  method1(ctx: RequestContext) {
    ctx.send('Hello, World!');
  }
}
```

In the "context-scoped" mode, controller methods bound to specific routes receive a single argument - the request context. That is, in this mode you will no longer be able to declare other method parameters. However, in the constructor you can still declare an arbitrary number of parameters that are created only once.

### Controller injector hierarchy {#controller-injector-hierarchy}

A controller [in injector-scoped mode][10], besides its own injector at the request level, also has three parent injectors: at the route level, module level and application level. These injectors are also formed based on the providers that you pass into the following arrays:

* `providersPerApp`;
* `providersPerMod`;
* `providersPerRou`;
* `providersPerReq` (this array forms the injector for a controller in injector-scoped mode).

Thus a controller in injector-scoped mode can depend on services at any level.

If a controller is [in context-scoped mode][11], its own injector is located at the module level, and it has one parent injector at the application level:

* `providersPerApp`;
* `providersPerMod` (this array forms the injector for a controller in context-scoped mode).

## Binding of the controller to the host module {#binding-of-the-controller-to-the-host-module}

Any controller should only be bound to the current module where it was declared, i.e. the host module. This binding is done via the `controllers` array:

```ts {4}
import { restModule } from '@ditsmod/rest';
import { SomeController } from './some.controller.js';

@restModule({ controllers: [SomeController] })
export class SomeModule {}
```

After binding controllers to the host module, in order for Ditsmod to recognize them in an external module, the host module must either be appended or imported as an object that implements the [ModuleWithParams][2] interface. The following example shows both appending and fully importing the host module (this is done only to demonstrate the possibility; in practice, there is no reason to do both at the same time):

```ts {5,7}
import { restModule } from '@ditsmod/rest';
import { SomeModule } from './some.module.js';

@restModule({
  appends: [SomeModule],
  // OR
  imports: [{ module: SomeModule, path: '' }]
})
export class OtherModule {}
```

If the module is imported without the `path` property, Ditsmod will only import [providers][3] and [extensions][9] from it:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { SomeModule } from './some.module.js';

@restModule({
  imports: [SomeModule]
})
export class OtherModule {}
```

You can read more detailed information in the section [Export, import and appends of modules][1].

## Services {#services}

While it's technically possible to get by with just one controller to handle an HTTP request, it's better to separate the extensive business logic code into separate classes so that the code can be reused as needed and is easier to test. These separate classes with business logic are usually called _services_.

What services can do:

- check access rights;
- validate the request;
- provide configuration;
- parsing the request body;
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

```ts {8-9}
import { restModule } from '@ditsmod/rest';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';

@restModule({
  providersPerReq: [
    FirstService,
    SecondService
  ],
})
export class SomeModule {}
```

Similarly, the services is passed in the controller metadata:

```ts {8-9}
import { controller, Res, route } from '@ditsmod/rest';

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

### Service injector hierarchy {#service-injector-hierarchy}

Unlike a controller, the injector of a given service can be at any level: at the application level, module level, route level, or request level. In practice, this means that the provider for a given service is passed into one (or several) `providersPer*` arrays. For example, in the following example `SomeService` is passed into the injector at the route level, and `OtherService` — into the module level:

```ts {5-6}
import { Injector } from '@ditsmod/core';
// ...

const providersPerApp = [];
const providersPerMod = [OtherService];
const providersPerRou = [SomeService];
const providersPerReq = [];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp);
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
```

In this case, if `SomeService` has a dependency on `OtherService`, DI will be able to create an instance of `SomeService`, because the injector at the route level can obtain an instance of `OtherService` from its parent injector at the module level. However, if `OtherService` depends on `SomeService`, DI will not be able to create an instance of `OtherService`, because the injector at the module level does not see its child injector at the route level.

The following example shows four different ways to request an instance of `SomeService` using `injectorPer*.get()` directly or via class method parameters:

```ts
injectorPerRou.get(SomeService); // Injector per route.
// OR
injectorPerReq.get(SomeService); // Injector per request.
// OR
@injectable()
class Service1 {
  constructor(private someService: SomeService) {} // Constructor's parameters.
}
// OR
@controller()
class controller1 {
  @route('GET', 'some-path')
  method1(someService: SomeService) {} // Method's parameters.
}
```

Here it is important to remember the following rule: the value for `SomeService` is created in the injector where the provider was passed, and this value is created only once on the first request. In our example, the `SomeService` class is actually passed to `injectorPerRou`, so the instance of the class `SomeService` will be created in `injectorPerRou`, even if this instance is requested in the child `injectorPerReq`.

This rule is very important because it clearly shows:

1. in which injector the value for a given provider is created;
2. that if you take a single injector, the value for a given provider (for a given token) is created only once in it;
3. that if the child injector lacks a provider, it can ask the parent injector for the *value* of that provider (i.e., the child injector asks the parent injector for the *value*, not for the provider itself).

This rule applies to the `injector.get()` method, but not to `injector.pull()` or `injector.resolveAndInstantiate()`.

## Transfer of providers to the DI registry {#transfer-of-providers-to-the-di-registry}

For a single dependency, one or more [providers][3] must be passed to the DI registry. Usually providers are passed to the DI registry via module metadata, although sometimes they are passed via controller metadata or even directly to [injectors][3]. In the following example `SomeService` is passed into the `providersPerMod` array:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { SomeService } from './some.service.js';

@restModule({
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

After such a transfer, consumers of providers can use `SomeService` within `SomeModule`. And now let's additionally pass another provider with the same token, but this time in the controller metadata:

```ts {8}
import { controller } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { OtherService } from './other.service.js';

@controller({
  providersPerReq: [
    { token: SomeService, useClass: OtherService }
  ]
})
export class SomeController {
  constructor(private someService: SomeService) {}
  // ...
}
```

Pay attention to the highlighted line. Thus we tell DI: "If this controller has a dependency on the provider with the token `SomeService`, it should be substituted with an instance of the class `OtherService`". This substitution will apply only to this controller. All other controllers in `SomeModule` will receive instances of `SomeService` for the `SomeService` token.

You can perform a similar substitution at the application or module level. This can sometimes be useful, for example when you want to have default configuration values at the application level but custom values for that configuration at a specific module level. In that case, first pass the default configuration in the root module:

```ts {6}
import { rootModule } from '@ditsmod/core';
import { ConfigService } from './config.service.js';

@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

And then in some module substitute `ConfigService` with an arbitrary value:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { ConfigService } from './config.service.js';

@restModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Re-adding providers {#re-adding-providers}

Different providers with the same token can be added many times in module or controller metadata, but DI will choose the provider that was added last (exceptions to this rule apply only for multi-providers):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [
    { token: 'token1', useValue: 'value1' },
    { token: 'token1', useValue: 'value2' },
    { token: 'token1', useValue: 'value3' },
  ],
})
export class SomeModule {}
```

In this case, within `SomeModule` the `token1` will return `value3` at the module, route or request level.

Additionally, different providers with the same token can be provided at multiple different hierarchy levels simultaneously, but DI will always choose the nearest injector (i.e., if a provider value is requested at the request level, the injector at the request level will be inspected first, and only if the required provider is not found there will DI ascend to parent injectors):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [{ token: 'token1', useValue: 'value1' }],
  providersPerRou: [{ token: 'token1', useValue: 'value2' }],
  providersPerReq: [{ token: 'token1', useValue: 'value3' }],
})
export class SomeModule {}
```

In this case, within `SomeModule` for `token1` the value `value3` will be returned at the request level, `value2` at the route level, and `value1` at the module level.

Also, if you import a provider from an external module and you have a provider with the same token in your current module, the local provider will have higher priority provided they were passed at the same hierarchy level.

[1]: /basic-components/modules/#import-module
[2]: /basic-components/modules/#ModuleWithParams
[3]: /basic-components/dependency-injection/#injector-and-providers
[5]: /rest-application/native-modules/body-parser#retrieving-the-request-body
[6]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/services/pre-router.ts
[7]: /basic-components/dependency-injection/
[9]: /basic-components/extensions/
[10]: #injector-scoped-controller
[11]: #context-scoped-controller
