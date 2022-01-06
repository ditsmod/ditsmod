---
sidebar_position: 2
---

# Dependency Injection

Since Ditsmod uses `@ts-stack/di` as a library for Dependency Injection, it is necessary to first study its [documentation][9]. Then, you will know what such terms as: injector, provider, token, hierarchy of injectors, substitution of providers, etc. mean.

## Introduction

If simplify the scheme of DI, can identify 4 main stages:

1. Scanning metadata collected from decorators of modules, controllers and services.
2. Formation of injectors taking into account the import/export declarations of each module.
3. Request an instance of a specific provider.
4. Creating an instance of this provider using previously formed injectors.

The first 2 steps occur when initializing the application before starting the web server.

<!-- :::tip The difference between a provider and a service
In order not to confuse the concept of **provider** with the concept of **service**, you can mention
Internet providers. There may be many such providers, but specifically for you - the service is
provided by one or two providers. Similarly in Ditsmod - you receive service in the concrete
controller, and providers for this service can be many.
::: -->

## Declare the provider level

Declaring the provider level means that at this level the instance of the specified provider
class will be [Singleton][12]. You can to do such declaration either in the module metadata or
in the controller metadata.

For example, in the controller you can declare providers at the HTTP-request level:

```ts
import { Controller } from '@ditsmod/core';

import { SomeService } from './some.service';

@Controller({ providersPerReq: [SomeService] }) // <-------
export class SomeController {
  constructor(private someService: SomeService) {}
}
```

As you can see, the `Controller`'s metadata has an object with the `providersPerReq`
property, where the array of providers that this controller needs in the constructor is passing.

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

By "lower priority" is meant that if the instructions for the DI contradict each other in
modules and in the controller, the DI will use the controller instruction.

For example, if the module specifies:

```ts
@Module({
  // ...
  providersPerReq: [{ provide: FirstService, useClass: ThirdService }],
})
export class SomeModule {}
```

and in the controller:

```ts
@Controller({ providersPerReq: [{ provide: FirstService, useClass: SecondService }] })
export class SomeController {
  // ..
}
```

Then DI will use the instruction of the controller and in the constructor of the controller will provide an instance of class `SecondService`.

## Multiple provider additions

In some module, a same provider can be added many times at the same level, but DI will choose the most recent one (there are exceptions to this rule, but this only applies to [multi-providers][10]). In addition, the same provider can be declared simultaneously on four levels, but providers in the `providersPerReq` array will have the highest priority, in the `providersPerRou` array - lower, in the `providersPerMod` array - even lower, and in` providersPerApp` lowest priority.

This can be used, for example, as follows:

1. first declare a some configuration provider **at the application level** in the root module;
2. if you need to change this configuration only for a some module, declare the same configuration provider, but **at the module level**, and make its substitution.

Also, if you are importing a some provider from an external module, and you have a provider with the same token in the current module, the local provider will have the highest priority, provided they are declared at the same level.

## Substitution providers

Since all default providers are added to the DI first, you can substitute each of them with your
own providers.

Probably the first thing you want to substitute is the logger provider, because default `Logger`
writes everything only to the console, and is used as a token for DI, as well as an interface.

What does "used as an interface" mean? - This means that if you want to substitute `Logger` with
your provider, your provider must have the same method's names and the same signature of these methods as
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
for the entire application, taking into account the hierarchy of injectors.

But if the scope is not extended, it will be limited only by the hierarchy of DI injectors.

:::tip When DI cannot find the desired provider
Remember that when DI cannot find the required provider, there are only three possible reasons:
1. you did not add the required provider to the metadata of the module or controller;
2. you have not imported the module where the provider you need is declared, or this provider is not exported;
3. you ask the parent injector for the provider from the child injector.
:::

## DI injectors

Injectors are part of DI, and injectors give you what you ask for in class constructor.

Injectors are instances of classes that have arrays of providers and methods for creating instances of these providers, taking into account the whole chain of their dependencies. When you pass providers to `providersPerApp`, `providersPerMod`, `providersPerRou` and
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
providers declared in the `providersPerReq` array. And although this injector sometimes requests the instances of providers from the parent injectors, it does not create them himself. Thus, the
constructor controller can have singletons from any level.

Each injector first looks at what is being asked at its level. If it doesn't find this, it can ask
about this the parent injector upstairs if one exists. And the parent injector, in turn, can rise
even higher until it finds the right one, otherwise the DI throws an error.

To understand what this means in practice, let's look at a specific example.

Suppose you create `ErrorHandlerService` and think: "Where to declare it? - Since this service may
be needed at any point in the application, then I need to declare it at the application level -
in `providersPerApp` array". But at the same time, in this service you want to see instances of
classes `Req` and `Res`, which in Ditsmod are declared at the request level:

```ts
import { Injectable } from '@ts-stack/di';
import { Logger, Req, Res, ControllerErrorHandler } from '@ditsmod/core';

@Injectable()
export class ErrorHandlerService implements ControllerErrorHandler {
  constructor(
    private req: Req,
    private res: Res,
    private log: Logger
  ) {}

  handleError(err: Error) {
    // Here is the error handling code
  }
}
```

You run the application, and when it comes to the operation of this service, DI throws the error
that it can not find a provider for `Req` and `Res`. But why? Maybe you need to declare
them yourself at the request-level, ie add them to the `providersPerReq` array? You do, but DI
still throws an error...

The reason is in the incorrectly declared level for `ErrorHandlerService`. Because you have declared this service at the application level, its instance will create an injector at the application level. This means that all the services you ask in the constructor, this injector will
look only in the array that you passed to `providersPerApp`.

However, `Req` and `Res` in Ditsmod are declared at the request level, ie these services
are in the child injectors, in relation to the injector at the application level. And the parent
injector knows nothing about the child injectors.

There are two ways to solve this issue:

1. remove `Req` and `Res` from the constructor of this service;
2. or declare `ErrorHandlerService` at the request level. However, in this case, the visibility
of `ErrorHandlerService` will still be limited only to the module where you declared this provider. To
correctly declare an error handler for the controller, see the [ditsmod seed repository][14].

### Current injector

You may rarely need the injector itself, but you can get it from the constructor like
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


[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://ts-stack.github.io/di/en/
[10]: https://ts-stack.github.io/di/en/#multi-providers

[107]: ./exports-and-imports
[121]: ./providers-collisions
[100]: #substitution-providers