---
sidebar_position: 2
---

# Dependency Injection

## Basic concepts

Ditsmod DI has the following basic concepts:

- dependency
- dependency token, token types
- provider
- injector
- injector hierarchy
- provider substitution

## Dependency

If creating an instance of a given class requires first creating instances of other classes, then that class has dependencies. For example, if you write this in the service constructor:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

this means that `SecondService` has a dependency on `FirstService`, and you is expected that DI will resolve this dependency as follows:

1. DI will first look through the constructor of `FirstService`;
2. if `FirstService` has no dependency, an instance of `FirstService` will be created;
3. instance of `FirstService` will be passed to the `SecondService` constructor.

If after the first step it turns out that `FirstService` has its own dependencies, then DI will recursively execute these three steps for each given dependency.

### Optional dependency

Sometimes you may need to specify an optional dependency in the constructor. Let's take a look at the following example, where a question mark is placed after the `firstService` property, thus indicating to TypeScript that this property is optional:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService?: FirstService) {}
  // ...
}
```

But DI will ignore this optionality and generate an error if there is no possibility to create `FirstService`. To make this code work, you need use the `optional` decorator:

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

One of the main features of DI is resolving a certain dependency, and when this dependency is requested again, providing a resolved value from the cache. That is, DI has a registry that contains a mapping between a particular dependency and its corresponding value. To uniquely identify each dependency, so-called **tokens** are used, which can have any JavaScript type except `undefined`. The dependency registry is formed when writing a Ditsmod application and schematically looks like the following:

```
token1 => value15
token2 => value100
...
```

To resolve dependencies, DI will search its registry for the corresponding values by token. In the constructors of modules, services or controllers, tokens are specified.

In the section [Passing providers to the DI registry][100] you will learn that DI allows you to pass any value for the same token. This feature is convenient to use for unit testing, because instead of a real dependency, you can pass a mock or stub to the registry. In this case, the DI registry looks something like this:

```
token1 => value1
token1 => mock
token2 => value14
token2 => stub
...
```

The token can have any type, but currently, there are limitations in DI that prevent it from distinguishing between different types of _arrays_ or _enums_. Additionally, it's important to remember that the token must remain in the JavaScript file after being compiled from TypeScript code, so interfaces or types declared using the `type` keyword cannot be used as tokens.

# The `inject` decorator

The `inject` decorator allows for the use of an alternative token, which is necessary for obtaining arrays, enums, or any other value in the constructor:

```ts {7}
import { injectable, inject } from '@ditsmod/core';

import { InterfaceOfItem } from './types';

@injectable()
export class SecondService {
  constructor(@inject('some token for an array') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

When `inject` is used, DI uses the token passed to it and ignores the type of the variable after the decorator, so this type can even be an interface.

Keep in mind that the easiest and most reliable dependency type to use is a class. DI recognizes well the types of different classes, even if they have the same name, so the `inject` decorator can not be used with them. For all other types of dependencies, we recommend using an instance of the `InjectionToken<T>` class as a token, and passing an arbitrary text value to its constructor for a short description:

```ts {14}
// tokens.ts
import { InjectionToken } from '@ditsmod/core';
import { InterfaceOfItem } from './types';

const SOME_TOKEN = new InjectionToken<InterfaceOfItem[]>('InterfaceOfItem');

// second-service.ts
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types';
import { SOME_TOKEN } from './tokens';

@injectable()
export class SecondService {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

## Provider

It was said above that DI has a registry containing the mapping between the token and the value to be issued for a particular dependency.

```
token1 => value15
token2 => value100
...
```

So these are the values DI creates using **providers**. In fact, DI resolves dependencies using the appropriate providers. So, to resolve a certain dependency, you first need to pass the corresponding provider to the DI registry, and then DI will issue an instance of this provider by its token. Providers can be either classes or objects of this type:

```ts {3-6}
import { Class } from '@ditsmod/core';

type Provider = { token: any, useClass: Class<any>, multi?: boolean } |
{ token: any, useValue: any, multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

_* here `Class<any>` means any class._

Note that the token for the provider with the `useFactory` property is optional, since DI can use the method of the specified class as a token.

Per dependency, one or more providers must be passed to the DI registry. Most often, this is done through the metadata of the module or controller, although sometimes they are passed directly to [injectors][102].

Now that you are familiar with the concept of **provider**, we can clarify that **dependency** means dependency on providers. Such dependencies are made by **consumers** of providers either in service constructors, or in constructors or methods of controllers, or in the `get()` method of [injectors][102] (more on this later).

In the example above, the definition of the provider object type is shown, the following values are passed to its properties:

- `useClass` - the class is passed, DI will make an instance of this class.
- `useValue` - any value is passed, DI will output it unchanged.
- `useFactory` - [tuple][11] is passed, where the class should be in the first place, and in the second place - the method of this class, which should return any value for the specified token. For example, if the class is like this:

  ```ts
  import { methodFactory } from '@ditsmod/core';

  export class ClassWithFactory {
    @methodFactory()
    method1(dependecy1: Dependecy1, dependecy2: Dependecy2) {
      // ...
      return '...';
    }
  }
  ```

  in this case, the provider must be transferred to the DI registry in the following format:

  ```ts
  { token: 'some token', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
  ```

  First, DI will create an instance of this class, then call its method and get the result, which will be associated with the specified token.

- `useToken` - another token is passed to this provider property. If you write the following:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  this is how you say DI: "When provider consumers request the `SecondService` token, the value for the `FirstService` token should be used". In other words, this directive makes an alias `SecondService` that points to `FirstService`. The DI algorithm in such cases is as follows:
    - When provider consumers request `SecondService`, DI will look up the value for it in its registry using the `FirstService` token.
    - After DI finds the value for `FirstService`, it will be returned to the consumer who requested `SecondService`.

### Passing of providers to the DI registry

Most often, providers are passed to the DI registry through module metadata. In the following example, `SomeService` is passed to the `providersPerMod` array:

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

After such a passing, consumers of providers can use `SomeService` within `SomeModule`. The identical result will be if we pass the same provider in object format:

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

And now let's additionally pass another provider with the same token, but this time in the controller metadata:

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

Pay attention to the highlighted line. This is how we say DI: "If this controller has a dependency on a provider with token `SomeService`, it should be substituted with an instance of class `OtherService`". This substitution will be valid only for this controller. All other controllers in `SomeModule` will receive `SomeService` class instances by `SomeService` token.

Similar substitution can be done at the application level and at the module level. This may sometimes be necessary, for example, when you want to have default configuration values at the application level, but custom values of this configuration at the level of a specific module. In this case, pass the default configuration in the root module first:

```ts {4}
// ...
@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

And in a certain module, we substitute `ConfigService` with an arbitrary value:

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

The above has been said many times for the so-called **DI registry**. Now that you know what DI uses the registry for, it's time to learn that these registries are in injectors, and there can be many such injectors in a Ditsmod application. But first, let's understand how injectors work.

If you greatly simplify the working scheme of DI, you can say that DI accepts an array of providers at the input, and at the output it issues an injector that is able to create instances of the transferred providers taking into account the dependencies between them. It has approximately the following picture:

```ts {16}
import 'reflect-metadata';
import { Injector, injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
class Service3 {
  constructor(service2: Service2) {}
}

const injector = Injector.resolveAndCreate([Service1, Service2, Service3]);
const service3 = injector.get(Service3);
```

The `Injector.resolveAndCreate()` method takes an array of classes into its registry at the input, and outputs a certain object, which is exactly what is called an **injector**. This injector obviously contains a registry of transferred classes, and is able to create their instances, taking into account the entire chain of dependencies (`Service3` -> `Service2` -> `Service1`).

What the injector does:

- when `Service3` is requested, injector looks at the constructor of this class, sees the dependency on `Service2`;
- then looks at the constructor in `Service2`, sees the dependency on `Service1`;
- then looks at the constructor in `Service1`, does not find dependencies there, and therefore first creates an instance of `Service1`;
- then creates an instance of `Service2`
- and the last one creates the `Service3` instance.

Using DI, you may not know the entire `Service3` dependency chain, entrust this work to the injector, the main thing is to transfer all necessary classes to the DI registry. Keep in mind that you can write unit tests for individual classes this way.

## Hierarchy of injectors

Ditsmod DI also allows you to create a hierarchy of injectors - this is when there are parent and child injectors. At first glance, there is nothing interesting in such a hierarchy, because it is not clear what it is needed for, but in Ditsmod this possibility is used very often, since it allows you to make the application architecture modular. It is worth paying special attention to the study of the specifics of the hierarchy, it will save you more than one hour of time in the future, because you will know how it works and why it does not find this dependency...

When creating a hierarchy, only the child injector holds the connection, it has an object of the parent injector. At the same time, the parent injector knows nothing about its child injectors. That is, the connection between injectors in the hierarchy is one-way. Conditionally, it looks like this:

```ts {6}
interface Parent {
  // There are certain properties of the parent injector, but no child injector
}

interface Child {
  parent: Parent;
  // There are other properties of the child injector.
}
```

By having a parent injector object, a child injector can refer to its parent when child needs a provider instance that it does not have.

Let's consider the following example. For simplicity, no decorators are used here at all, since each class is independent:

```ts {8-9}
import { Injector } from '@ditsmod/core';

class Service1 {}
class Service2 {}
class Service3 {}
class Service4 {}

const parent = Injector.resolveAndCreate([Service1, Service2]); // Parent injector
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

As you can see, when the child injector was created, `Service1` was not passed to it, so when an instance of this class is requested, it will turn to the parent. By the way, there is one non-obvious but very important point here: child injectors only request certain instances of classes from parent injectors and do not create them on their own. That is why this expression returns `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

And `Service2` is in both injectors, so each of them will create its own local version of this service, and that is why this expression returns `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

The parent injector cannot create an instance of the `Service3` class because the parent injector has no connection to the child injector that contains `Service3`.

Well, both injectors cannot issue `Service4` instance, because they were not given this class when they were created.

### Hierarchy of injectors in the Ditsmod application

Earlier in the documentation, you encountered the following object properties that are passed in module or controller metadata:

- `providersPerApp` - providers at the application level;
- `providersPerMod` - providers at the module level;
- `providersPerRou` - providers at the route level;
- `providersPerReq` - providers at the HTTP request level.

Using these arrays, Ditsmod forms four different injectors from them, which are connected by a hierarchical relationship. The highest in the hierarchy is the application-level injector, whose registry is formed from the `providersPerApp` array. The second in the hierarchy is the module-level injector, the third is the route-level injector, and the fourth is the HTTP request-level injector. When planning to pass providers to the arrays mentioned above, always consider the hierarchy of injectors. Note that higher-level injectors do not have access to lower-level injectors.

For example, if you write a class that has a dependency on an HTTP request, you will be able to pass it only to the `providersPerReq` array, because only this array is used to create an injector that will have access to the HTTP request. On the other hand, this provider will have access to all its parent injectors: at the routing, module, and application levels. It should be remembered that if the providers are classes or factories (objects with the `useFactory` property), their instances will be created each time, for each HTTP request.

You can also write a class and pass it to the `providersPerMod` array, in which case it can depend only on providers at the module level, or at the application level. If you try to add to its constructor providers that you passed to the `providersPerRou` or `providersPerReq` array, you will get an error that those providers are not found. Instances of providers at the module level are created only once after the application is launched.

Of course, you can also pass providers to the application or routing level, and they will have similar limitations given the injector hierarchy.

### Hierarchy of controller injectors

Any controller, in addition to its own injector at the request level, also has three parent injectors: at the route, module, and application levels. These injectors are also generated based on the providers you pass in the following arrays:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (<-- this is the array from which the injector for the controller is formed).

### Hierarchy of service injectors

Unlike the controller, the injector of a certain service can be at any level: at the application, module, route, or request level. In practice, this means that the provider for this service is transferred to one (or several) of the above-mentioned arrays. For example, in the following example, `SomeService` is passed to the injector at the request level, and `OtherService` is passed to the injector at the module level:

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

You may rarely need the service or controller injector itself directly, but you can get it in the constructor like any other provider instance:

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

Keep in mind that this way you get an injector that created an instance of this service. The hierarchy level of this injector depends only on the registry of the injector to which `SecondService` was transferred.

## Re-adding providers

The same provider can be added multiple times in the metadata of a module or controller, but DI will choose the provider that was added last (there is an exception to this rule, but it only applies to multi-providers). Additionally, the same provider can be passed simultaneously to four injectors at different levels of the hierarchy, but DI will always choose the closest injectors (ie, if a value for a provider is queried at the request level, then the injector at the request level will be looked up first, and only if there is no required provider, DI will rise to the parent injectors).

Also, if you import a specific provider from an external module and you have a provider with the same token in the current module, the local provider will have higher priority, provided they were passed at the same level of the injector hierarchy.

## When DI can't find the right provider

Remember that when DI cannot find the right provider, there are only three possible reasons:

1. you did not transfer the required provider to DI in the metadata of the module or controller (well, or in the case of testing - in `Injector.resolveAndCreate()`);
2. you did not import the module where the provider you need is transferred, or this provider is not exported;
3. you ask the parent injector for the provider from the child injector.


[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[9]: https://github.com/ts-stack/di
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types

[107]: /components-of-ditsmod-app/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #passing-of-providers-to-the-di-registry
[101]: #hierarchy-of-injectors
[102]: #injector
