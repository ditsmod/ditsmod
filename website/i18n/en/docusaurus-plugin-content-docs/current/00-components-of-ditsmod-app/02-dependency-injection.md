---
sidebar_position: 2
---

# Dependency Injection

## Basic concepts

Under the hood, Ditsmod uses [@ts-stack/di][9] v2 as a library for Dependency Injection (DI for short), it has the following basic concepts:

- dependency
- dependency token, token's types
- provider
- injector
- hierarchy of injectors
- substitute of providers

## Dependency

In a DI system, a dependency is what you want to get in the final result in particular in the constructors of controllers, services, modules. For example, if you write the following in the service constructor:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

this means that `SecondService` has a dependency on `FirstService`, and DI is expected to resolve this dependency as follows:

1. first, DI will look at the `FirstService` constructor;
2. if `FirstService` does not have a dependency, an instance of `FirstService` will be created;
3. this instance will be passed to the `SecondService` constructor.

If, after executing the first clause, it turns out that `FirstService` has its own dependencies, then DI will recursively execute these three clauses for each given dependency.

### Optional dependency

Sometimes you may need to specify an optional dependency in the constructor. Let's consider the following example, where near the `firstService` property is a question mark, thus indicating to TypeScript that this property is optional:

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

DI has a registry that contains the mapping between a token and its value. This registry is formed by the DI user, and schematically it looks like this:

```
token1 => value15
token2 => value100
...
```

To resolve dependencies, DI will search its registry for matching values specifically by tokens. Basically, a token is an identifier for a particular dependency. In the constructors of modules, services or controllers, tokens are specified.

In the section [Transferring providers to the DI registry][100], you will learn that DI allows you to transfer any value for the same token. This feature is convenient to use for unit-testing, because instead of a real dependency, you can pass a mock or stub to the registry. In this case, the DI registry will appear approximately as follows:

```
token1 => value1
token1 => mock
token2 => value14
token2 => stub
...
```

A token can be of any type, but DI currently has a feature that makes DI not distinguish between different types of _array_ or _enum_. In addition, you should remember that the token must remain in the JavaScript file after compilation from TypeScript code, so interfaces or types declared with the `type` keyword cannot be used as a token. The `inject` decorator allows you to use an alternative token, it is necessary to receive an array, enum, or any other value in the constructor:

```ts {7}
import { injectable, inject } from '@ditsmod/core';

import { InterfaceOfItem } from './types';

@injectable()
export class SecondService {
  constructor(@inject('some token for an array') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

When `inject` is used, DI uses the token passed to it and ignores the type of the variable that this decorator is in front of, so that type can even be an interface.

Keep in mind that the easiest and most reliable type of dependency to use is a class. DI is good at recognizing types of different classes, even if they have the same name, so you can avoid using the `inject` decorator with them. For all other types of dependencies, we recommend using an instance of the `InjectionToken<T>` class as a token, an arbitrary text value for a short description is passed to its constructor:

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

It was said above that DI has a registry that contains the mapping between the token and the value that needs to be issued for a particular dependency.

```
token1 => value15
token2 => value100
...
```

So, these values are created by DI using providers. In essence, DI resolves the dependency using the appropriate providers. So, to resolve a certain dependency, you first need to pass the corresponding provider to the DI registry, and then DI will issue an instance of that provider by its token. Providers can be either classes or objects with the following type:

```ts {3-6}
import { Class } from '@ditsmod/core';

type Provider = { token: any, useClass: Class<any>, multi?: boolean } |
{ token: any, useValue: any, multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

_* Here, the entry `Class<any>` means any class._

Note that the token for the provider with the `useFactory` property is optional because DI can use a method of the specified class as a token.

For one dependency, you need to transfer one or more providers to the DI registry. Most often, this transfer occurs via module or controller metadata, although sometimes it is passed directly to [injectors][102].

Now that you have already familiarized with the concept of **provider**, you can clarify that **dependency** means dependency on providers. **Consumers** of providers have such a dependency either in service constructors, or in constructors or methods of controllers, or in the `get()` method of [injectors][102] (this will be mentioned later).

In the example above, the definition of the provider object type is shown, the following values are passed to its properties:

- `useClass` - passed class, DI will instantiate this class.
- `useValue` - any value is passed, DI will output it unchanged.
- `useFactory` - is passed [tuple][11], where the first place should be the class, and the second place should be a method of this class, which should return any value for the specified token. For example, if the class is like this:

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

  in this case, the provider should be transferred to the DI registry in the following format:

  ```ts
  { token: 'some token', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
  ```

  First, DI will create an instance of this class, then call its method and get a result that will be associated with the specified token.

- `useToken` - another token is passed to this property of the provider. If you write the following:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  this way you tell the DI: "When provider consumers request a `SecondService` token, the value for the `FirstService` token must be used." In other words, this directive makes an alias `SecondService` that points to `FirstService`. The DI work algorithm in such cases is as follows:
    - When providers consumers request a `SecondService`, DI will search its registry for a value for it by the `FirstService` token.
    - After DI finds a value for `FirstService`, it will be returned to the consumer that searched for `SecondService`.

### Transfer of providers to the DI registry

Most often, providers are passed to the DI registry via module metadata. In the following example, `SomeService` is passed into the `providersPerMod` array:

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

And now let's additionally pass another provider with the same token, but this time in the metadata of the controller:

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

Note the highlighted line. This way we tell DI: "If this controller has a dependency on a provider with the `SomeService` token, it needs to be substituted by an instance of the `OtherService` class." This substitute will only work for this controller. All other controllers in `SomeModule` will receive `SomeService` class instances by `SomeService` token.

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

The `ReflectiveInjector.resolveAndCreate()` method takes an array of classes into its registry at the input, and outputs a certain object, which is exactly what is called an **injector**. This injector obviously contains a registry of transferred classes, and is able to create their instances, taking into account the entire chain of dependencies (`Service3` -> `Service2` -> `Service1`).

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

As you can see, when the child injector was created, `Service1` was not passed to it, so when an instance of this class is requested, it will turn to the parent. By the way, there is one non-obvious but very important point here: although child injectors request certain instances of classes from parent injectors, they do not create them themselves. This is why this expression returns `true`:

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

Using these arrays, Ditsmod forms from them four different injectors which are connected by a hierarchical connection. The highest in the hierarchy is the injector at the application level, its registry is formed from the `providersPerApp` array. The second in the hierarchy is the injector at the module level, the third is the injector at the route level, and the fourth is the injector at the HTTP request level. When you plan to pass providers to injectors, be sure to consider their hierarchy. Let me remind you that injectors higher in the hierarchy do not have access to injectors lower in the hierarchy.

For example, if you write a class that has a dependency on an HTTP request, you can pass it only to the `providersPerReq` array, because only from this array forms an injector that will have access to the HTTP request. On the other hand, this provider will have access to all of its parent injectors: at the route, module, and application level. At the same time, it is worth remembering that if the providers are classes or factories (objects with the `useFactory` property), their instances will be created every time, for every HTTP request.

You can also write a class and pass it to the `providersPerMod` array, in which case it can depend only on providers at the module level or at the application level. If you try to add to its constructor the providers that you passed in the `providersPerRou` or `providersPerReq` array, you will get an error saying that those providers were not found. Instances of providers at the module level are created only once after the application is launched.

Of course, you can also pass providers to the application or route level, and they will have similar restrictions given the injector hierarchy.

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

The same provider can be added multiple times in the metadata of a module or controller, but DI will choose the provider that was added last (there is an exception to this rule, but it only applies to [multi-providers][10]). Additionally, the same provider can be passed simultaneously to four injectors at different levels of the hierarchy, but DI will always choose the closest injectors (ie, if a value for a provider is queried at the request level, then the injector at the request level will be looked up first, and only if there is no required provider, DI will rise to the parent injectors).

Also, if you import a specific provider from an external module and you have a provider with the same token in the current module, the local provider will have higher priority, provided they were passed at the same level of the injector hierarchy.

## When DI can't find the right provider

Remember that when DI cannot find the right provider, there are only three possible reasons:

1. you did not transfer the required provider to DI in the metadata of the module or controller (well, or in the case of testing - in `ReflectiveInjector.resolveAndCreate()`);
2. you did not import the module where the provider you need is transferred, or this provider is not exported;
3. you ask the parent injector for the provider from the child injector.


[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[14]: https://github.com/ditsmod/seed/blob/901f247/src/app/app.module.ts#L18
[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[9]: https://ts-stack.github.io/di/en/
[10]: https://ts-stack.github.io/di/#%D0%BC%D1%83%D0%BB%D1%8C%D1%82%D0%B8-%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B9%D0%B4%D0%B5%D1%80%D0%B8
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types

[107]: /components-of-ditsmod-app/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #transfer-of-providers-to-the-di-registry
[101]: #hierarchy-of-injectors
[102]: #injector
