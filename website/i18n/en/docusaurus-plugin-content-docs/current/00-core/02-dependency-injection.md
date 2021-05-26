---
sidebar_position: 2
---

# Dependency Injection

## Introduction

During application initialization, DI collects metadata from modules, controllers, and services,
then analyzes the **dependency** of each class on the other classes and prepares the appropriate
kits to **resolve this dependency**.

For example, if a security module requires a database module and a logger module, DI prepares
a set of classes assembled from these two modules.

So it turns out that if a certain class depends on another class, it does not import it directly
from a specific file, but takes it through an intermediary - through the DI system. This scheme
allows you to substitute classes through DI.

In practice, this means, for example, that you can substitute the default logger with your own
logger. And, pay attention that you not only can use other logger, and you can do **substitution**
of the logger already registered in the code. You can say, "DI, use my logger anywhere in the
application and even in the Ditsmod core".

The same applies to any class on which other classes depend - they can all be substitute via DI.
That is, in addition to the logger, you can substitute: router, error handler,
various default configurations and even `Request` and `Response` classes.

For the developer, this opens up ample opportunities to both modify and extends the Ditsmod
applications.

And to provide in the class constructor what you ask for, [DI][8] must be instructed where to get
it. But it may seem strange. Why? - Let's look at an example:

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

Here, DI should provide an instance of the `FirstService` class, and at first glance, you clearly
specify which file to import this class from, but that's not enough, because DI remembers
`FirstService` only as a search key. This is done so that you can then say, "DI, when you see this
key, make an instance of a certain class, and substitute it here".

[Later][100] you will learn that without changing the code in this example, you can substitute the
`FirstService` class, for example, with a test class. When you substitute one class with another
class, it's like providing another **provider** to create a class instance.

Similarly, without changing the example code, you can still change the **level** at which the
provider is declared for `FirstService` so that its instance is created:

- only once at the start of the application;
- or each time it is imported into the some module;
- or each time a specific route is created;
- or for each HTTP request.

Because, without changing the code of this example, you can get different results in the
`firstService` property, it turns out that it is not enough to simply specify the import source for
a particular service. For clarity, at least, it is necessary to additionally declare **level** of
the provider `FirstService`.

:::tip The difference between a provider and a service
In order not to confuse the concept of **provider** with the concept of **service**, you can mention
Internet providers. There may be many such providers, but specifically for you - the service is
provided by one or two providers. Similarly in Ditsmod - you receive service in the concrete
controller, and providers for this service can be many.
:::

## Declare the provider level

Declaring the provider level means that at this level the instance of the specified provider
class will be [Singleton][12]. You can to do such declaration either in the module metadata or
in the controller metadata.

For example, in the controller you can declare providers at the HTTP-request level:

```ts
import { Controller } from '@ditsmod/core';

import { SomeService } from './some.service';

@Controller({ providersPerReq: [SomeService] })
export class SomeController {
  constructor(private someService: SomeService) {}
}
```

As you can see, the `Controller`'s metadata has an object with the `providersPerReq`
property, where the array of providers that this controller needs in the constructor is passing.

And if we want to substitute some provider, we will write it like this:

```ts
import { Controller } from '@ditsmod/core';

import { FirstService } from './first.service';
import { SecondService } from './second.service';

@Controller({ providersPerReq: [{ provide: FirstService, useClass: SecondService }] })
export class SomeController {
  constructor(private firstService: FirstService) {}
}
```

That is, instead of passing the `FirstService` class to the `providersPerReq` array, we pass the
object `{ provide: FirstService, useClass: SecondService}`. Thus we instruct DI that for
constructor instead of an instance of class `FirstService`, to pass an instance of class
`SecondService`.

You can also declare providers at the HTTP request level in the module, but they will have a lower
priority than declaration via the controller:

```ts
import { Module } from '@ditsmod/core';

import { SomeService } from './some.service';

@Module({
  providersPerApp: [],
  providersPerMod: [],
  providersPerRou: [],
  providersPerReq: [SomeService],
})
export class SomeModule {}
```

As you can see, in the metadata of the module you can declare providers on **four levels**.

## Priority of providers

The same provider can be added many times at the same level, but DI will choose the most recent one
(there are exceptions to this rule, but this only applies to multi-providers, which will be
mentioned later). In addition, the same provider can be declared simultaneously on four levels, but
providers in the `providersPerReq` array will have the highest priority, in the `providersPerRou`
array - lower, in the `providersPerMod` array - even lower, and in` providersPerApp` lowest
priority.

This can be used, for example, as follows:

1. first declare a specific configuration provider **at the application level** in the root module;
2. if you need to change this configuration only for a single module, you need to use the same
configuration provider, but **at the module level**, and make its substitute.

Also, if you are importing a specific provider from an external module, and you have the same
provider in the current module, the local provider will have a higher priority if they are declared
at the same level. A similar rule applies to the controller - the provider declared in the
controller will have a higher priority than the provider with the same token declared in the
module.

## Substitution providers

Since all default providers are added to the DI first, you can substitute each of them with your
own providers.

Probably the first thing you want to substitute is the logger provider, because default `Logger`
writes everything only to the console, and is used as a token for DI, as well as an interface.

What does "used as an interface" mean? - This means that if you want to substitute `Logger` with
your provider, your provider must have the same methods and the same signature of these methods as
it is in `Logger`.

When your provider implements the `Logger` interface, you will have to substitute it with DI:

```ts
import { RootModule, Logger } from '@ditsmod/core';

import { MyLogger } from './my-logger';

@RootModule({
  providersPerApp: [{ provide: Logger, useClass: MyLogger }],
})
export class SomeModule {}
```

To substitute any Ditsmod default provider with your own provider, the algorithm of your actions
is the same as shown in the previous example:

1. learn the providers API that you want to substitute;
2. implement the same API in your providers;
3. make a substitution default provider by your provider.

## The scopes and the declaration levels

Do not confuse the four levels of provider declaration with their scopes. When you passing
a provider to one of the arrays: `providersPerApp`,` providersPerMod`, `providersPerRou` or
`providersPerReq` - you declare at which level the [singleton][12] of this provider will be created.
But this is not the same as the scopes of providers.

For example, if in `SomeModule` you declare `ConfigService` at the `providersPerMod` level, it
means that the singleton of this service will be created at this module level and will be
available only within this module. That is, any other module will not be able to see
`ConfigService` for a while.

However, to increase the scope of `ConfigService` you must export it from `SomeModule`, then all
modules that import `SomeModule` will also have their own singleton `ConfigService` at the module
level.

As you can see, the scope of providers is expanded by [exporting these providers][107] followed by
importing the modules where they are declared. Although, if the providers are declared in the root
module, and you need them in another module, you do not need to import the root module. It is
enough to export the required providers in the root module, after which their scope will increase
for the entire application.

But if the scope is not extended, it will be limited only by the hierarchy of DI injectors.

## DI injectors

Injectors are part of DI, and although they weren't mentioned in the documentation before, you're
already a little familiar with their work - the injectors give you what you ask for in class
constructors.

Injectors are instances of classes that have arrays of providers and methods for finding those
providers. When you pass providers to `providersPerApp`, `providersPerMod`, `providersPerRou` and
`providersPerReq` arrays you are actually passing this data to four different injectors which
connected by a hierarchical connection. This connection is held by the child injector because it
has a reference to the parent injector. At the same time, the parent injector knows nothing about
its child injectors.

_Note:_ the number mentioned - four injectors - is not the total number of injectors in the
application, it is the number of injectors in the hierarchy. That is, a single controller works
with these four injectors, but since there can be many controllers, there may be more injectors.

Thus, these four injectors have the following hierarchy:

1. The highest in the hierarchy is the application-level injector, it only sees the providers that
you pass to the `providersPerApp` array anywhere in the application. It is the only one for the
entire application, from which branch off injectors at the module level.
2. The module-level injector sees all providers in the `providersPerMod` array for a particular
module, as well as in the `providersPerApp` array anywhere in the application. The total number of
such injectors is equal to the number of modules in the application. From this injector branch off
child injectors at the route level.
3. The route-level injector sees all providers in the `providersPerRou` and `providersPerMod`
arrays of a particular module, as well as in `providersPerApp` anywhere in the application. The
total number of these injectors is equal to the number of defined routes in entire application.
From this injector branch off child injectors at the HTTP-request level.
4. The request-level injector sees all providers in the `providersPerReq`, `providersPerRou`
and `providersPerMod` arrays of a particular module, as well as in `providersPerApp` anywhere in
the application. The total number of these injectors is equal to the number of simultaneous HTTP
requests processed in a given period of time.

To create singletons of services, each injector uses only those providers that are declared at its
level. For example, the injector at the request level creates singletons only from the list of
providers declared in the `providersPerReq` array. And although it also sees providers from parent
injectors, it can only use ready-made parent's instances of providers, not creates them. Thus, the
constructor controller can have singletons from any level.

Each injector first looks at what is being asked at its level. If it doesn't find this, it can ask
about this the parent injector upstairs if one exists. And the parent injector, in turn, can rise
even higher until it finds the right one, otherwise the DI throws an error.

To understand what this means in practice, let's look at a specific example.

Suppose you create `ErrorHandlerService` and think: "Where to declare it? - Since this service may
be needed at any point in the application, then I need to declare it at the application level -
in `providersPerApp` array". But at the same time, in this service you want to see instances of
classes `Request` and `Response`:

```ts
import { Injectable } from '@ts-stack/di';
import { Logger, Request, Response, ControllerErrorHandler } from '@ditsmod/core';

@Injectable()
export class ErrorHandlerService implements ControllerErrorHandler {
  constructor(
    private req: Request,
    private res: Response,
    private log: Logger
  ) {}

  handleError(err: Error) {
    // Here is the error handling code
  }
}
```

You run the application, and when it comes to the operation of this service, DI throws the error
that it can not find a provider for `Request` and `Response`. But why? Maybe you need to declare
them yourself at the request-level, ie add them to the `providersPerReq` array? You do, but DI
still throws an error...

The reason is in the incorrectly declared level for `ErrorHandlerService`. Because you have
declared this service at the application level, it will be taken care of by the injector at the
application level. This means that all the services you ask in the constructor, this injector will
look only in the array that you passed to `providersPerApp`.

However, `Request` and `Response` in Ditsmod are declared at the request level, ie these services
are in the child injectors, in relation to the injector at the application level. And the parent
injector knows nothing about the child injectors.

There are two ways to solve this issue:

1. you remove `Request` and `Response` from the constructor of this service;
2. or you declare `ErrorHandlerService` at the request level. However, in this case, the visibility
of `ErrorHandlerService` will be limited only to the module where you declared this provider. To
correctly declare an error handler for the controller, see the [ditsmod seed repository][14].

### Current injector

Most likely, you may rarely need the injector itself, but you can get it from the constructor like
any other instance of the provider:

```ts
import { Injectable, Injector } from '@ts-stack/di';
import { FirstService } from './first.service';

@Injectable()
export class SecondService {
  constructor(private injector: Injector) {}

  someMethod() {
    const firstService = this.injector.get(FirstService);
  }
}
```

Keep in mind that this way you get the injector that created the instance of this provider.

## DI tokens

Injectors use so-called _tokens_ as keys to search for providers. The token type can be either
a class, or an object, or a string, or a JavaScript symbol. Interfaces or types declared with the
`type` keyword cannot be used as tokens, because once they are compiled from TypeScript into
JavaScript, there will be nothing left of them in JavaScript files.

Also, you cannot use arrays as a token, because TypeScript does not yet have a mechanism to pass
the type of this array to the compiled JavaScript code.

However, in constructor as a token it is easiest to specify a class of a certain service:

```ts
import { Injectable } from '@ts-stack/di';

import { SecondService } from './second.service';

@Injectable()
export class FirstService {
  constructor(private secondService: SecondService) {}

  methodOne() {
    this.secondService.doSomeThing();
  }
}
```

DI will look through the constructor, will find `SecondService` then in the corresponding injectors
will look for the provider on this class. It should be noted that DI uses the class as a token, not
the class name.

For tokens of other types, in constructor it is necessary to use the `Inject` decorator before
access modifiers. For example, you can use the string `tokenForLocal` as a token:

```ts
import { Injectable, Inject } from '@ts-stack/di';

@Injectable()
export class SomeService {
  constructor(@Inject('tokenForLocal') private local: string) {}

  methodOne() {
    this.local;
  }
}
```

In this case, in order for DI to be able to find a suitable provider, you need to declare this
provider with the same token:

```ts
import { Module } from '@ditsmod/core';

@Module({
  providersPerMod: [
    { provide: 'tokenForLocal', useValue: 'uk' }
  ]
})
export class SomeModule {}
```

Note that the `useValue` property is used when declaring a provider. In this case, DI will not try
to create a class instance, but will return the value you passed without change.

:::tip For DI it is better to use classes
As a token for DI, it is recommended to use classes wherever possible. It is quite rare to need to
use other types of tokens.
:::


### InjectionToken

In addition to the ability to use tokens that have different types of data, DI has a special class
recommended for creating tokens - `InjectionToken`. Because it has a parameter for the type
(generic), you can read the data type that DI will return when requesting a specific token:

```ts
import { InjectionToken } from '@ts-stack/di';

export const localToken = new InjectionToken<string>('tokenForLocal');
```

It can be used in the same way as all other non-class tokens:

```ts
import { Injectable, Inject } from '@ts-stack/di';

import { localToken } from './tokens';

@Injectable()
export class SomeService {
  constructor(@Inject(localToken) private local: string) {}

  methodOne() {
    this.local;
  }
}
```

Note that `InjectionToken` is imported from `@ts-stack/di`, not from `@ditsmod/core`.

Declaring the provider level:

```ts
import { Module } from '@ditsmod/core';

import { localToken } from './tokens';

@Module({
  providersPerMod: [
    { provide: localToken, useValue: 'uk' }
  ]
})
export class SomeModule {}
```


[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://en.wikipedia.org/wiki/Dependency_injection

[107]: ./exports-and-imports
[121]: ./providers-collisions
[100]: #substitution-providers