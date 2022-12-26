---
sidebar_position: 2
---

# Dependency Injection

## Basic concepts

Under the hood, Ditsmod uses [@ts-stack/di][9] as a library for Dependency Injection (DI for short), it has the following basic concepts:

- dependency
- dependency token, token types
- provider
- injector
- hierarchy of injectors
- substitution providers

## Dependency

In a DI system, dependency is everything you want to get in the final result in the constructors of controllers, services, modules. For example, if you write the following in the service constructor:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

this means that `SecondService` has a dependency on `FirstService`, and expected that DI will be resolve this dependency as follows:

1. first, DI will look at the `FirstService` constructor;
2. then, if `FirstService` has no dependency, an instance of `FirstService` will be created;
3. this instance will be passed to the `SecondService` constructor.

If, after executing the first item, it turns out that `FirstService` has its own dependencies, then DI will execute these three items for each given dependency.

### optional dependency

Sometimes you may need to specify an optional dependency in the constructor. Let's consider the following example, where after the `firstService` property is followed a question mark, thus indicating to TypeScript that this property is optional:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService?: FirstService) {}
  // ...
}
```

But DI will ignore this optionality and throw an error if there is no way to create `FirstService`. For this code to work, you need to use the `optional` decorator:

```ts {7}
import { injectable, optional } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

## Dependency token

DI has a registry that contains a mapping between a token and a value for a given dependency. Basically, a token is an identifier for a particular dependency. In the constructors of modules, services, or controllers actually specify the dependency tokens, not the dependencies themselves. To resolve dependencies, DI will search its registry for matching values specifically by tokens.

In the section [Ditsmod Provider Replacement][100] you will learn that DI allows for the same token to pass any value to the constructor. This feature is convenient to use for testing, because instead of a real dependency, you can pass a mock or stub to the constructor.

On the other hand, a token can be of any type except an array or enum. Additionally, you must remember that the token must remain in the JavaScript file after compilation from TypeScript code, so interfaces or types declared with the `type` keyword cannot be used as a token.

If you need to pass an array or enum to the constructor of your class, you can use the `inject` decorator:

```ts {7}
import { injectable, inject } from '@ditsmod/core';

import { InterfaceOfItem } from './types';

@injectable()
export class SecondService {
  constructor(@inject('some token for an array') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

As you can see, `inject` accepts a token for a specific dependency. When `inject` is used, DI ignores the type of the variable in back of this decorator.

## Provider

DI resolves the dependency using appropriate providers, which can be either classes or objects of the following type:

```ts {3-6}
import { Type } from '@ditsmod/core';

type Provider = { token: any, useClass: Type<any>, multi?: boolean } |
{ token: any, useValue: any, multi?: boolean } |
{ token: any, useFactory: Function, deps?: any[], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

For one dependency, you need to transfer one or more providers to the DI registry. Most often, this transfer occurs via module or controller metadata, although sometimes it is passed directly to [injectors][102].

Now that you have already familiarized with the concept of **provider**, you can clarify that **dependency** means dependency on providers. **Consumers** of providers have this dependency either in class constructors or in the `get()` method of [injectors][102] (it will be mentioned later).

The preceding code shows the definition of the provider object type, there a token is passed to the `provide` property, and the value that needs to be transferred for this token is passed to the other properties:

  - `useClass` - the passed class (DI will instantiate this class).
  - `useValue` - any value is passed.
  - `useFactory` - a callback is passed that should return any value. If the callback has dependencies, the tokens of these dependencies must be passed in the `deps: []` array. For example, if the callback is:

  ```ts
  function callback(someService: SomeService) {
    // ...
    return 'some value';
  }
  ```

  In this case, you need to transfer the provider in the following format:

  ```ts
  { token: 'some token here', useFactory: callback, deps: [SomeService] }
  ```

  - `useToken` - another token is passed. If you write the following:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  this way you tell the DI: "When provider consumers request a `SecondService` token, the value assigned to the `FirstService` token must be used." In other words, this directive makes an alias `SecondService` that points to `FirstService`. The DI work algorithm in such cases is as follows:
     - When provider consumers request a `SecondService`, DI will search in its registry for a value for it by the `FirstService` token.
     - Once DI finds a value for `FirstService`, that value will be used.

### Examples of transferring providers to the DI registry

Most often, providers are transferred to the DI registry via module metadata. In the following example, `SomeService` is passed into the `providersPerMod` array:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service';

@featureModule({
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

After such transfer, consumers of providers can use `SomeService` within `SomeModule`. The identical result will be if we transfer the same provider in the object format:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service';

@featureModule({
  providersPerMod: [
    { token: SomeService, useClass: SomeService }
  ],
})
export class SomeModule {}
```

And now let's pass another provider in the controller metadata with the same token:

```ts {3}
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

Note the highlighted line. Thus, we tell DI: "If there is a dependency with the token `SomeService` in the constructor of this controller, it must be substituted by an instance of `OtherService`." This substitution will only work for this controller. All other controllers in `SomeModule` will receive `SomeService` instances by the `SomeService` token.

A similar substitution can be made at the application level and at the module level. This can sometimes be necessary, for example when you want to have default configuration values at the application level, but custom values of this configuration at the level of a specific module. In this case, we will first transfer the default config in the root module:

```ts {4}
// ...
@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

And in a certain module, we replace `ConfigService` with an arbitrary value:

```ts {4}
// ...
@featureModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Injector

If greatly simplify the scheme of DI, we can say that DI accepts an array of providers at the input, and at the output it issues an injector that is able to create instances of the accepted providers taking into account the dependencies between them.

If you abstract from Ditsmod, in practice it has approximately the following picture:

```ts {16}
import 'reflect-metadata';
import { ReflectiveInjector, injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
class Service3 {
  constructor(service2: Service2) {}
}

const injector = ReflectiveInjector.resolveAndCreate([Service1, Service2, Service3]);
const service3 = injector.get(Service3);
```

The `ReflectiveInjector.resolveAndCreate()` method takes an array of classes at the input and outputs a specific object called an **injector**. This injector obviously contains the transferred classes, and is able to create their instances, considering all chain of dependencies (`Service3` -> `Service2` -> `Service1`).

What the injector does:

- when `Service3` is requested, injector looks at the constructor of this class, sees the dependency on `Service2`;
- then looks at the constructor in `Service2`, sees the dependency on `Service1`;
- then looks at the constructor in `Service1`, does not find dependencies there, and therefore first creates an instance of `Service1`;
- then creates an instance of `Service2`
- and the last one creates the `Service3` instance.

In this case, you may not know the whole chain of dependencies `Service3`, entrust this work to the injector, the main thing - give to its array all the necessary classes. In this way, you can write unit tests for individual classes.

## Hierarchy of injectors

Ditsmod DI also allows you to create a hierarchy of injectors - this is when there are parent and child injectors. At first glance, there is nothing interesting in such a hierarchy, because it is not clear why it is needed, but in Ditsmod this feature is used very often, because it allows you to make the application architecture modular. Special attention should be paid to the study of the specifics of the hierarchy, it will save you a lot of time in the future, because you will know how it works and why it does not find this dependency...

When creating a hierarchy, the connection is held only by the child injector, it has the object of the parent injector. At the same time, the parent injector knows nothing about its child injectors. That is, the connection between the injectors is one-way. Conventionally, it looks like this:

```ts {6}
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

```ts {8-9}
import { ReflectiveInjector } from '@ditsmod/core';

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

And `Service2` has both injectors, so each of them will create its own local version of this service, and that's why this expression returns `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

The parent injector cannot create an instance of the `Service3` class because the parent injector has no connection to the child injector that has `Service3`.

Well, both injectors can't create a `Service4` instance because they weren't given this class when they were created.

### Hierarchy of controller injectors

Any controller, in addition to its own injector at the request level, also has three parent injectors: at the route, module, and application levels. These injectors are generated based on the data you pass in the following arrays:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (<-- this is the array from which the injector for the controller is formed).

You can find these property names either in the controller metadata or in the module metadata.

### Hierarchy of service injectors

Unlike a controller, the injector of a certain service can be at any level: at the application, module, route, or request level. In practice, this means that the provider for this service is transferred to one (or several) of the above-mentioned arrays. For example, in the following example `SomeService` is passed to the injector at the request level and `OtherService` - at the module level:

```ts
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service';
import { OtherService } from './other.service';

@featureModule({
  providersPerMod: [OtherService],
  providersPerReq: [SomeService],
})
export class SomeModule {}
```

In this case, if `SomeService` has a dependency on `OtherService`, DI will be able to create an instance of `SomeService` because a request-level injector can get an instance of `OtherService` from its parent module-level injector. But if on the contrary - `OtherService` will have a dependency on `SomeService` - DI will not be able to create an instance of `OtherService`, because the injector at the module level does not see its child injector at the request level.

### Current injector

You may rarely need the injector itself, but you can get it from the constructor like any other instance of the provider:

```ts
import { injectable, Injector } from '@ditsmod/core';
import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private injector: Injector) {}

  someMethod() {
    const firstService = this.injector.get(FirstService);  // Lazy loading of dependency
  }
}
```

Keep in mind that this way you get the injector that created the instance of this service.

## Multiple provider additions

In a given module, the same provider can be added multiple times to the same injector, but DI will select the provider that was added last (there are exceptions to this rule, but this only applies to [multi-providers][10]). In addition, the same provider can be transmitted simultaneously to up to four injectors at different levels, but DI will always choose the closest injectors (ie, if a value for a provider is asking at the request level, the injector at the request level will be looked up first, and only if the desired provider is not there, DI will rise to the parent injectors).

This can be used, for example, as follows:

1. first pass a some configuration provider **at the application level** in the root module;
2. if you need to change this configuration only for a separate module, substitute this provider, but **at the module level**.

Also, if you are importing a some provider from an external module, and you have a provider with the same token in the current module, the local provider will have the highest priority, provided they are passed at the same level.

## Substitution providers

Since all Ditsmod default providers are added to the DI first, you can substitute each of them with your own providers.

Probably the first thing you want to substitute is the logger provider, because default `Logger` writes everything only to the console, and is used as a token for DI, as well as an interface.

What does "used as an interface" mean? - This means that if you want to substitute `Logger` with your provider, your provider must have the same method's names and the same signature of these methods as it is in `Logger`.

When your provider implements the `Logger` interface, you will have to substitute it with DI:

```ts {6}
import { rootModule, Logger } from '@ditsmod/core';

import { MyLogger } from './my-logger';

@rootModule({
  providersPerApp: [{ token: Logger, useClass: MyLogger }],
})
export class SomeModule {}
```

To substitute any Ditsmod default provider with your own provider, the algorithm of your actions is the same as shown in the previous example:

1. learn the providers API that you want to substitute;
2. implement the same API in your providers;
3. make a substitution default provider by your provider.

## When DI cannot find the right provider

Remember that when DI cannot find the required provider, there are only three possible reasons:
1. you did not transfer the required provider to DI in the metadata of the module or controller (well, or in the case of testing - in `ReflectiveInjector.resolveAndCreate()`);
2. you have not imported the module where the provider you need is passed, or this provider is not exported;
3. you ask the parent injector for the provider from the child injector.


[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://ts-stack.github.io/di/en/
[10]: https://ts-stack.github.io/di/en/#multi-providers

[107]: /components-of-ditsmod-app/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #substitution-providers
[101]: #hierarchy-of-injectors
