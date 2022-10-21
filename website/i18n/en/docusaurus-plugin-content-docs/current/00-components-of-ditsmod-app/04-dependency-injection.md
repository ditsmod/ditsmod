---
sidebar_position: 4
---

# Dependency Injection

## Базові поняття

Ditsmod uses [@ts-stack/di][9] as a library for Dependency Injection, it has the following basic concepts:

- provider
- token
- injector
- hierarchy of injectors
- substituting of providers

If greatly simplify the scheme of Dependency Injection (abbreviated - DI), we can say that DI accepts an array of providers at the input, and at the output it issues an injector that is able to create instances of the accepted providers taking into account the dependencies between them.

If you abstract from Ditsmod, in practice it has approximately the following picture:

```ts
import 'reflect-metadata';
import { ReflectiveInjector, Injectable } from '@ts-stack/di';

class Service1 {}

@Injectable()
class Service2 {
  constructor(service1: Service1) {}
}

@Injectable()
class Service3 {
  constructor(service2: Service2) {}
}

const injector = ReflectiveInjector.resolveAndCreate([Service1, Service2, Service3]);
const service3 = injector.get(Service3);
```

The `ReflectiveInjector.resolveAndCreate()` method takes an array of classes at the input and outputs a specific object called an injector. This injector obviously contains the transferred classes, and is able to create their instances, considering all chain of dependencies (`Service3` -> `Service2` -> `Service1`).

That is, the work of the injector is that when it is asked `Service3`, it looks at the constructor of this class, sees the dependence on `Service2`, then sees its constructor, sees the dependence on `Service1`, looks at its constructor, does not find there dependencies, and therefore creates the first - instance `Service1`. Once you have the `Service1` instance, you can create the `Service2` instance, and once you've done that, you can finally create the `Service3` instance.

In this case, you may not know the whole chain of dependencies `Service3`, entrust this work to the injector, the main thing - give to its array all the necessary classes.

## Hierarchy of injectors

The `@ts-stack/di` library also allows you to create a hierarchy of injectors - this is when there are parent and child injectors. At first glance, there is nothing interesting in such a hierarchy, because it is not clear why it is needed, but in Ditsmod this feature is used very often, because it allows you to make the application architecture modular. Special attention should be paid to the study of the specifics of the hierarchy, it will save you a lot of time in the future, because you will know how it works and why it does not find this dependence...

When creating a hierarchy, the connection is held only by the child injector, it has the object of the parent injector. At the same time, the parent injector knows nothing about its child injectors. That is, the connection between the injectors is one-way. Conventionally, it looks like this:

```ts
interface Parent {
  // There are certain properties of the parent injector, but no child injector
}

interface Child {
  parent: Parent;
  // There are other properties of the child injector.
}
```

Due to the presence of the parent injector object, the child injector may contact the parent injector when asked for an instance of a class that it does not have.

Let's consider the following example. For simplicity, decorators are not used here at all, as each class is independent:

```ts
import { ReflectiveInjector } from '@ts-stack/di';

class Service1 {}
class Service2 {}
class Service3 {}
class Service4 {}

const parent = ReflectiveInjector.resolveAndCreate([Service1, Service2]); // Parent injector
const child = parent.resolveAndCreateChild([Service2, Service3]); // Child injector

child.get(Service1); // ОК
parent.get(Service1); // ОК

parent.get(Service1) === child.get(Service1); // true

child.get(Service2); // ОК
parent.get(Service2); // ОК

parent.get(Service2) === child.get(Service2); // false

child.get(Service3); // ОК
parent.get(Service3); // Error - No provider for Service3!

child.get(Service4); // Error - No provider for Service4!
parent.get(Service4); // Error - No provider for Service4!
```

As you can see, when creating a child injector, it was not given `Service1`, so when you request an instance of this class, it will contact its parent. By the way, there is one unobvious but very important point here: although the child injectors ask the parent injectors for certain instances of the classes, they do not create them on their own. That is why this expression returns `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

And `Service2` has both injectors, so each of them will create its own local version, and that's why this expression returns `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

The parent injector cannot create an instance of the `Service3` class because the parent injector has no connection to the child injector that has `Service3`.

Well, both injectors can't create a `Service4` instance because they weren't given this class when they were created.

### Hierarchy of controller injectors

Any controller, in addition to its own injector at the request level, also has three parent injectors at the root, module, and application levels. These injectors are generated based on the data you pass in the following arrays:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (<-- this is the array from which the injector for the controller is formed).

You can find these property names either in the controller metadata or in the module metadata.

### Hierarchy of provider injectors

Unlike a controller, a provider of a given service may not have any parent injectors at all, although it may have as many as the controller does, depending on the **level** of the provider's declaration. In practice, this means that the provider is transferred to one (or several) of the above-mentioned arrays. For example, in the following example `SomeService` is declared at the request level and `OtherService` is declared at the module level:

```ts
import { Module } from '@ditsmod/core';

import { SomeService } from './some.service';
import { OtherService } from './other.service';

@Module({
  providersPerMod: [OtherService],
  providersPerReq: [SomeService],
})
export class SomeModule {}
```

In this case, if `SomeService` has a dependency on `OtherService`, DI will be able to create an instance of `SomeService` because a request-level injector can get an instance of `OtherService` from its parent module-level injector. But if on the contrary - `OtherService` will have a dependency on `SomeService` - DI will not be able to create an instance of `OtherService`, because the injector at the module level does not see its child injector at the request level.

### Current injector

You may rarely need the injector itself, but you can get it from the constructor like any other instance of the provider:

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

## Basic stages of DI operation in Ditsmod applications

We can distinguish 4 main stages:

1. Scanning metadata collected from module decorators, controllers and services.
2. On the basis of scanned metadata, the formation of a hierarchy of injectors taking into account the import/export declarations of each module.
3. Request an instance of a certain provider.
4. Creation of an instance of this provider using previously created injectors.

The first 2 stages occur during application initialization, before the web server starts.

## Multiple provider additions

In some module, a same provider can be added many times at the same level, but DI will choose the most recent one (there are exceptions to this rule, but this only applies to [multi-providers][10]). Additionally, the same provider can be declared at four levels at the same time, but DI will always choose the closest injectors (ie, if a value for a provider is asking at the request level, the injector at the request level will be looked up first, and only if the desired provider is not there, DI will rise to the parent injectors).

This can be used, for example, as follows:

1. first declare a some configuration provider **at the application level** in the root module;
2. if you need to change this configuration only for a some module, declare the same configuration provider, but **at the module level**, and make its substitution.

Also, if you are importing a some provider from an external module, and you have a provider with the same token in the current module, the local provider will have the highest priority, provided they are declared at the same level.

## Substitution providers

Since all default providers are added to the DI first, you can substitute each of them with your own providers.

Probably the first thing you want to substitute is the logger provider, because default `Logger` writes everything only to the console, and is used as a token for DI, as well as an interface.

What does "used as an interface" mean? - This means that if you want to substitute `Logger` with your provider, your provider must have the same method's names and the same signature of these methods as it is in `Logger`.

When your provider implements the `Logger` interface, you will have to substitute it with DI:

```ts
import { RootModule, Logger } from '@ditsmod/core';

import { MyLogger } from './my-logger';

@RootModule({
  providersPerApp: [{ provide: Logger, useClass: MyLogger }],
})
export class SomeModule {}
```

To substitute any Ditsmod default provider with your own provider, the algorithm of your actions is the same as shown in the previous example:

1. learn the providers API that you want to substitute;
2. implement the same API in your providers;
3. make a substitution default provider by your provider.

## The scopes and the declaration levels

Do not confuse the four levels of provider declaration with their scopes. When you passing a provider to one of the arrays: `providersPerApp`,` providersPerMod`, `providersPerRou` or `providersPerReq` - you declare at which level the [singleton][12] of this provider will be created. But this is not the same as the scopes of providers.

For example, if in `SomeModule` you declare `ConfigService` at the `providersPerMod` level, it means that the singleton of this service will be created at this module level and will be available only within this module. That is, any other module will not be able to see `ConfigService` for a while.

However, to increase the scope of `ConfigService` you must export it from `SomeModule`, then all modules that import `SomeModule` will also have their own singleton `ConfigService` at the module level.

As you can see, the scope of providers is expanded by [exporting these providers][107] followed by importing the modules where they are declared. If the necessary providers are exported in the root module, their visibility will increase for the entire application, taking into account the hierarchy of injectors (they become global).

But if the scope is not extended, it will be limited only by the [hierarchy of DI injectors][101].

:::tip When DI cannot find the desired provider
Remember that when DI cannot find the required provider, there are only three possible reasons:
1. you did not add the required provider to the metadata of the module or controller;
2. you have not imported the module where the provider you need is declared, or this provider is not exported;
3. you ask the parent injector for the provider from the child injector.
:::


[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://ts-stack.github.io/di/en/
[10]: https://ts-stack.github.io/di/en/#multi-providers

[107]: ./exports-and-imports
[121]: ./providers-collisions
[100]: #substitution-providers
[101]: #hierarchy-of-injectors