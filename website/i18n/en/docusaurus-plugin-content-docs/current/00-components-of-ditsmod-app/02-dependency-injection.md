---
sidebar_position: 2
---

# Dependency Injection

## Why do you need DI?

Let's first get a general idea of how [Dependency Injection][1] (or just DI) works, and then look at each important component in detail.

It's probably easiest to understand exactly what DI does by looking at examples. Let's start with examples where DI is not used. In this case, we need an instance of the `Service3` class and its `doSomething()` method:

```ts {12-14} title='./services.ts'
export class Service1 {}

export class Service2 {
  constructor(private service1: Service1) {}
  // ...
  // Using this.service1 in one of the methods.
}

export class Service3 {
  constructor(private service2: Service2) {}

  doSomething(param1: any) {
    // Using this.service2 in this method.
  }
}

export function getService3() {
  const service1 = new Service1();
  const service2 = new Service2(service1);
  return new Service3(service2);
}
```

As you can see, `Service3` depends on `Service2`, which depends on `Service1`. While the `Service3` instance is quite easy to get:

```ts {5} title='./some.service.ts'
import { getService3 } from './services.js';

export class SomeService {
  method1() {
    const service3 = getService3();
    service3.doSomething(123);
  }
}
```

The `getService3` function is hard-coded to create an instance of `Service3`, and this is a problem because writing unit tests for this function is problematic, especially in the context of an EcmaScript module, since you cannot substitute `Service1` and `Service2` with mocks. Another serious drawback of the `getService3` function is that it can become quite complex in a real application, since it has to consider the configuration of each of the dependencies. That is, in the first case in the `getService3` body, it can be expected to create new `Service1` and `Service2` instances each time, in the second case - they must be [singletons][15] for the entire application, and in the third case - only one of them should be singleton...

The following example already uses DI, although this example is almost the same as the previous example, where we also declared the `Service3` class, but here we added an `injectable` decorator above each class that has a constructor with parameters, and did not create a `getService3` function:

```ts {5,12} title='./services.ts'
import { injectable } from '@ditsmod/core';

export class Service1 {}

@injectable()
export class Service2 {
  constructor(private service1: Service1) {}
  // ...
  // Using this.service1 in one of the methods.
}

@injectable()
export class Service3 {
  constructor(private service2: Service2) {}

  doSomething(param1: any) {
    // Using this.service2 in one of the methods.
  }
}
```

It's important to understand that the `injectable` decorator is only needed because there is no way in JavaScript code to specify the type of the parameter in the constructor, as it is done in TypeScript code. The role of the `injectable` decorator is very simple - its presence tells the TypeScript compiler that it is necessary to transfer to the JavaScript code those metadata that are in the TypeScript code in the class constructors. For example, the presence of the `injectable` decorator over the `Service2` class will signal to the TypeScript compiler that it should remember `Service1` as the first parameter in the constructor. This metadata is exported into JavaScript code using the TypeScript compiler and stored using the methods of the `Reflect` class from the `reflect-metadata` library.

Later, when [we pass classes with stored metadata to DI](#passing-of-providers-to-the-di-registry), this metadata can be read by DI and used to automatically substitute the corresponding class instances, so we can request an instance of `Service3` in the constructor of any class in our program:

```ts {4,6,9} title='./some.service.ts'
import { injectable } from '@ditsmod/core';
import { Service3 } from './services.js';

@injectable()
export class SomeService {
  constructor(private service3: Service3) {}

  method1() {
    this.service3.doSomething(123);
  }
}
```

As you can see, we no longer create an instance of `Service3` using the `new` operator, instead, DI does this and passes the finished instance to the constructor. Even if the parameters in the `Service3` constructor are changed later, nothing will have to be changed in the places where `Service3` is used.

## Injector

In the description of providers it was mentioned about _DI registers_, now let's understand how these registers are formed and where exactly they are located.

If you greatly simplify the scheme of operation of DI, you can say that DI accepts an array of providers at the input, and at the output produces an **injector** that is able to create values for each transmitted provider. That is, DI registers are formed based on arrays of providers that are passed to the injector:

```ts {15}
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
service3 === injector.get(Service3); // true
service3 === injector.resolveAndInstantiate(Service3); // false
```

As you can see, the `Injector.resolveAndCreate()` method accepts an array of providers as an input, and outputs an injector that can output the value of each provider by its token using the `injector.get()` method, taking into account the entire chain of dependencies (`Service3` -> `Service2` -> `Service1`).

What the `injector.get()` does:

- when `Service3` is requested, injector looks at the constructor of this class, sees the dependency on `Service2`;
- then looks at the constructor in `Service2`, sees the dependency on `Service1`;
- then looks at the constructor in `Service1`, does not find dependencies there, and therefore first creates an instance of `Service1`;
- then creates the `Service2` instance using the `Service1` instance;
- and lastly creates the `Service3` instance using the `Service2` instance;
- if the `Service3` instance is requested again later, the `injector.get()` method will return the previously created `Service3` instance from the cache of this injector.

Sometimes the last point (when the `Service3` instance is returned from the injector cache) is undesirable. In this case, you can use the `injector.resolveAndInstantiate()` method, which accepts a provider, resolves it in the context of the current injector, and returns a new instance of the given provider each time.

When automatically resolving a class dependency (when the injector is not used directly), Ditsmod uses the `injector.get()` method under the hood.

Using DI, you may not know the entire `Service3` dependency chain, entrust this work to the injector, the main thing is to transfer all necessary classes to the DI registry. Keep in mind that you can write unit tests for individual classes this way.

## Hierarchy and encapsulation of injectors {#hierarchy-and-encapsulation-of-injectors}

DI provides the ability to create a hierarchy and encapsulation of injectors, involving parent and child injectors. It is precisely through this hierarchy and encapsulation that the structure and modularity of an application are built. On the other hand, where there is encapsulation, there are rules to learn in order to understand when one service can access a specific provider and when it cannot.

Let's consider the following situation. Imagine you need to create a default configuration for the entire application and a custom configuration for specific modules. This means that at the level of certain modules, you will modify the configuration, and you need to ensure that it does not affect the default value or other modules. The following pseudo-code demonstrates the basic concept that ensures such behavior:

```ts
// Parent injector
class InjectorPerApplication {
  locale = 'en';
  token1 = 'value1';
  token2 = 'value2';
  // ...
}

// Child injector
class InjectorPerModule {
  injectorPerApp: InjectorPerApplication;
  locale = 'uk';
}
```

The child injector can refer to the parent injector because it has the appropriate variable containing the parent injector instance. On the other hand, the parent injector does not have access to the child injector, so it can only find values for those providers explicitly passed to it.

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

As you can see, when the child injector was created, `Service1` was not passed to it, so when an instance of that class is requested, it goes to the parent. By the way, there is one non-obvious but very important point here: through the `get()` method, child injectors only request certain instances of classes from parent injectors, and they do not create them themselves. That is why this expression returns `true`:

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

Earlier in this documentation, you encountered the following object properties that are passed in module or controller metadata:

- `providersPerApp` - providers at the application level;
- `providersPerMod` - providers at the module level;
- `providersPerRou` - providers at the route level;
- `providersPerReq` - providers at the HTTP request level.

Using these arrays, Ditsmod creates different injectors that are connected in a hierarchical relationship. Such a hierarchy can be simulated as follows:

```ts
import { Injector } from '@ditsmod/core';

const providersPerApp = [];
const providersPerMod = [];
const providersPerRou = [];
const providersPerReq = [];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp);
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
```

Under the hood, Ditsmod performs a similar procedure multiple times for different modules, routes, and requests. For example, if the Ditsmod application has two modules and ten routes, one injector will be created at the application level, one injector for each module (2 pcs), one injector for each route (10 pcs), and one injector for each request. Request-level injectors are automatically removed after processing each request.

Recall that injectors higher in the hierarchy do not have access to injectors lower in the hierarchy. This means that **when you transfer a class to a particular injector, you need to consider the minimum level of its dependency hierarchy**.

For example, if you write a class that depends on an HTTP request, you can only pass it to the `providersPerReq` array, as only from this array an injector is formed, to which Ditsmod will automatically add the provider with the HTTP request object. On the other hand, an instance of this class will have access to all of its parent injectors: at the route, module, and application levels. Therefore, this class can depend on providers at any level.

You can also write a certain class and pass it to the `providersPerMod` array. In this case, it can only depend on providers at the module or application level. If it depends on the providers you passed in the `providersPerRou` or `providersPerReq` array, you will get an error saying that those providers were not found.

### Hierarchy of controller injectors

The controller in [injector-scoped][103] mode, in addition to its own injector at the request level, also has three parent injectors: at the route, module, and application levels. These injectors are also generated based on the providers you pass in the following arrays:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (this is an array from which the injector for the controller in injector-scoped mode is formed).

That is, the controller in injector-scoped mode can depend on services at any level.

If the controller in [context-scoped][103] mode, its own injector is at the module level, and it has one parent injector at the application levels:

- `providersPerApp`;
- `providersPerMod` (this is the array from which the injector for the controller in context-scoped mode is formed).

### Hierarchy of service injectors

Unlike the controller, the injector of a certain service can be at any level: at the application, module, route, or request level. In practice, this means that the provider for this service is transferred to one (or several) of the above-mentioned arrays. For example, in the following example, `SomeService` is passed to the injector at the route level, and `OtherService` is passed to the injector at the module level:

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

In this case, if `SomeService` has a dependency on `OtherService`, DI will be able to create an instance of `SomeService` because a route-level injector can get an instance of `OtherService` from its parent module-level injector. But if on the contrary - `OtherService` will have a dependency on `SomeService` - DI will not be able to create an instance of `OtherService`, because the injector at the module level does not see its child injector at the route level.

The following example shows four different cases for requesting a `SomeService` instance using the `injectorPer*.get()` method directly or via class method parameters:

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

Here it's important to remember the following rule: the value for `SomeService` is created in the injector where the provider is passed, and this value is created only once upon the first request. In our example, the `SomeService` class is actually passed to `injectorPerRou`, so the instance of the `SomeService` class will be created in `injectorPerRou`, even if this instance is requested in the child `injectorPerReq`.

This rule is very important because it clearly shows:

1. in which injector the value for a specific provider is created;
2. if we take a separate injector, the value for a specific provider (for a specific token) is created only once within it;
3. if a child injector lacks a specific provider, it can refer to the parent injector for the _value_ of that provider (i.e., the child injector requests the _value_ of the provider from the parent injector, not the provider itself).

This rule works for `injector.get()`, but not for `injector.pull()` or `injector.resolveAndInstantiate()`.

### The `injector.pull()` method

This method makes sense to use only in a child injector when it lacks a certain provider available in the parent injector, and that provider depends on another provider that is present in the child injector.

For example, when `Service` depends on `Config`, and `Service` exists only in the parent injector, while `Config` exists in both the parent and child injectors:

```ts {16}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([Service, { token: Config, useValue: { one: 1, two: 2 } }]);
const child = parent.resolveAndCreateChild([{ token: Config, useValue: { one: 11, two: 22 } }]);
child.get(Service).config; // returns from parent injector: { one: 1, two: 2 }
child.pull(Service).config; // pulls Service in current injector: { one: 11, two: 22 }
```

As you can see, if you use `child.get(Service)` in this case, `Service` will be created with the `Config` from the parent injector. However, if you use `child.pull(Service)`, it will first pull the required provider into the child injector and then create its value in the context of the child injector without adding it to the injector cache (i.e., `child.pull(Service)` will return a new instance each time).

But if the requested provider exists in the child injector, the expression `child.pull(Service)` will behave identically to `child.get(Service)` (with the addition of the provider's value to the injector cache):

```ts {14-15}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([]);
const child = parent.resolveAndCreateChild([Service, { token: Config, useValue: { one: 11, two: 22 } }]);
child.get(Service).config; // { one: 11, two: 22 }
```

### Current injector

You may rarely need the service or controller injector itself, but you can get it in the constructor, just like the values of any other provider:

```ts {6}
import { injectable, Injector } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private injector: Injector) {}

  someMethod() {
    const firstService = this.injector.get(FirstService);  // Lazy loading of dependency
  }
}
```

Keep in mind that this way you get an injector that created an instance of this service. The hierarchy level of this injector depends only on the registry of the injector to which `SecondService` was transferred.

## The "magic" of working with metadata

From a JavaScript developer's point of view, the fact that DI can somehow look through the parameters of class constructors and see other classes there can be called "magic". If you look at the `@ditsmod/core` repository, you can see that:

1. in the file `tsconfig.json` is specified ["emitDecoratorMetadata": true][12];
2. the `package.json` file specifies the dependency on the [reflect-metadata][13] library;
3. there are a number of decorators (`rootModule`, `featureModule`, `controller`, `injectable`...).

All of these components provide the "magic" of reading and storing the metadata that you write in your classes using decorators. You may not have a deep understanding of exactly how this "magic" works, but you should at least remember what its components are.

It's also worth noting that Ditsmod doesn't use [new decorators][14] because they don't yet have an API for handling method parameters.

## Dependency

If creating an instance of a given class requires first creating instances of other classes, then that class has dependencies. For example, if you write this in the service constructor:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

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

If you forget to write (or intentionally remove) the `injectable` decorator before a class that has dependencies in the constructor, DI will throw an error saying that it cannot resolve the dependency of the given class. This is because `injectable` is involved in reading and saving class metadata.

### Optional dependency

Sometimes you may need to specify an optional dependency in the constructor. Let's take a look at the following example, where a question mark is placed after the `firstService` property, thus indicating to TypeScript that this property is optional:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService?: FirstService) {}
  // ...
}
```

But DI will ignore this optionality and generate an error if there is no possibility to create `FirstService`. To make this code work, you need use the `optional` decorator:

```ts {6}
import { injectable, optional } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

## Dependency token

You've seen the dependency token many times in previous examples, but we haven't formally introduced it yet. Let's go back to the previous example:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

This implies that `FirstService` is a class, and because of this it can be used both as a TypeScript type and as a **token**. Basically, a token is an identifier that is associated with the corresponding dependency. It is very important to understand that the token usage mechanism itself is required for JavaScript runtime, therefore, as tokens, you cannot use the types that you declare in TypeScript code with the keywords `interface`, `type`, `enum`, etc., because they don't exist in JavaScript code.

Unlike a class, an array cannot be used both as a TypeScript type and as a token at the same time. On the other hand, a token can have a completely irrelevant data type relative to the dependency it is associated with, so for example a string token type can be associated with a dependency that has any TypeScript type, including arrays, interfaces, enums, etc.

You can transfer the token in the short or long form of specifying the dependency. In the last example, a **short form** of specifying the dependency is used, it has significant limitations, because in this way it is possible to specify a dependency only on a certain _class_.

And there is a **long form** of specifying a dependency using the `inject` decorator, which allows you to use an alternative token:

```ts {6}
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';

@injectable()
export class SecondService {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

When `inject` is used, DI only considers the token passed to it. In this case, DI ignores the variable type - `InterfaceOfItem[]` - and uses the `some-string` as the token. In other words, DI uses `some-string` as the key to find the corresponding value for the dependency of type `InterfaceOfItem[]`. Thus, DI allows you to separate token and variable type, so you can get any kind of dependency in the constructor, including different types of arrays or enums.

A token can be a reference to a class, object or function, and text, numeric values, and symbols can also be used as a token. For the long form of specifying dependencies, we recommend using an instance of the `InjectionToken<T>` class as the token, since the `InjectionToken<T>` class has a parameterized type `T` that can be used to specify the type of data associated with that token:

```ts {5,14}
// tokens.ts
import { InjectionToken } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';

const SOME_TOKEN = new InjectionToken<InterfaceOfItem[]>('SOME_TOKEN');

// second-service.ts
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';
import { SOME_TOKEN } from './tokens.js';

@injectable()
export class SecondService {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

## Providers

DI has a registry, which is essentially a mapping between a token and the value to be issued for that token. Schematically, this registry can be shown as follows:

```
token1 -> value15
token2 -> value100
...
```

As you might guess, when DI resolves a dependency, it takes tokens from the constructor parameters of a particular class and looks for their values in the DI registry. If all the required tokens are found in the registry, their values are passed to the constructor, successfully resolving the dependency of that class.

DI creates values in the registry for each token using what are called **providers**. A provider can be either a class or an object:

```ts {3-8}
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: NonNullable<unknown>, useClass: Class<any>, multi?: boolean } |
{ token: NonNullable<unknown>, useValue?: any, multi?: boolean } |
{ token?: NonNullable<unknown>, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token?: NonNullable<unknown>, useFactory: (...args: any[]) => any, deps: any[], multi?: boolean } |
{ token: NonNullable<unknown>, useToken: any, multi?: boolean }
```

*_note that the token for the provider with the `useFactory` property is optional because DI can use a function or method of the specified class as the token._

So, in order for DI to resolve a certain dependency, the corresponding provider must first be passed to the DI registry, and then DI will issue the value of that provider by its token. Therefore, if you specified a certain dependency in a class, but did not pass the corresponding provider, DI will not be able to resolve that dependency. The [next section][100] discusses how providers can be passed to DI.

If the provider is represented as an object, the following values can be passed to its properties:

- `useClass` - the class whose instance will be used as the value of this provider is passed here. An example of such a provider:

  ```ts
  { token: 'token1', useClass: SomeService }
  ```
- `useValue` - any value other than `undefined` is passed here, DI will output it unchanged. An example of such a provider:

  ```ts
  { token: 'token2', useValue: 'some value' }
  ```
- `useFactory` - you can pass arguments here in two forms.

  - The **first form** (recommended because of its better encapsulation) assumes that a [tuple][11] is passed to `useFactory`, where the first place should be a class, and the second place should be a method of this class that must return some value for the specified token. For example, if the class is like this:

    ```ts
    import { factoryMethod } from '@ditsmod/core';

    export class ClassWithFactory {
      @factoryMethod()
      method1(dependecy1: Dependecy1, dependecy2: Dependecy2) {
        // ...
        return '...';
      }
    }
    ```

    in this case, the provider must be transferred to the DI registry in the following format:

    ```ts
    { token: 'token3', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
    ```

    First, DI will create an instance of this class, then call its method and get the result, which will be associated with the specified token. A method of the specified class can return any value except `undefined`.

  - The **second form** implies that you can pass a function to `useFactory` that can have parameters - that is, it can have a dependency. This dependency must be additionally manually specified in the `deps` property as an array of tokens, and the order in which the tokens are passed is important:
    ```ts {6}
    function fn1(service1: Service1, service2: Service2) {
      // ...
      return 'some value';
    }

    { token: 'token3', useFactory: fn1, deps: [Service1, Service2] }
    ```

    Please note that it is the provider _tokens_ that are passed to the `deps` property, and DI perceives them as tokens, not providers. That is, for these tokens, the DI registry will still need to [transfer the corresponding providers][100]. Also note that no parameter decorators are passed via `deps` (for example `optional`, `skipSelf`, etc.). If your factory requires parameter decorators, you need to use the first form of passing arguments to `useFactory`.

- `useToken` - another token is passed to this provider property. If you write the following:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  this is how you tell DI: "When consumers of providers request the `SecondService` token, the value for the `FirstService` token should be used". In other words, this directive makes an alias `SecondService` that points to `FirstService`.

Now that you are familiar with the concept of **provider**, you can clarify that **dependency** means dependency on **provider value**. Consumers of provider values have such a dependency either in service constructors, in controller constructors or methods, or in the `get()` method of [injectors][102] (more on this later).

## Multi-providers

This type of provider exists only in the form of an object, and it differs from regular DI providers by the presence of the `multi: true` property. Such providers are advisable to use when there is a need to transfer several providers with the same token to DI at once, so that DI returns the same number of values for these providers in one array:

```ts
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // ['uk', 'en']
```

Basically, multi-providers allow you to create groups of providers that share a common token. This feature is particularly used to create the `HTTP_INTERCEPTORS` group, as well as to create various [extension groups][104].

It is not allowed that both regular and multi-providers have the same token in one injector:

```ts {5-6}
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk' },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // Error: Cannot mix multi providers and regular providers
```

Child injectors can only return multi-provider values from the parent injector if no providers with the same tokens were passed to them when they were created:

```ts
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([]);

const locals = child.get(LOCAL); // ['uk', 'en']
```

If both the child and the parent injector have multi-providers with the same token, the child injector will return values only from its array:

```ts
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([
  { token: LOCAL, useValue: 'аа', multi: true }
]);

const locals = child.get(LOCAL); // ['аа']
```

### Substituting multi-providers

To make it possible to substituting a specific multi-provider, you can do the following:

1. transfer a certain class to the multi-provider object using the `useToken` property;
2. then transfer this class as a regular provider;
3. next, you need to transfer the provider to the array of providers to substitute this class.

```ts
import { Injector, HTTP_INTERCEPTORS } from '@ditsmod/core';

import { DefaultInterceptor } from './default.interceptor.js';
import { MyInterceptor } from './my.interceptor.js';

const injector = Injector.resolveAndCreate([
  { token: HTTP_INTERCEPTORS, useToken: DefaultInterceptor, multi: true },
  DefaultInterceptor,
  { token: DefaultInterceptor, useClass: MyInterceptor }
]);

const locals = injector.get(HTTP_INTERCEPTORS); // [MyInterceptor]
```

This construction makes sense, for example, if the first two points are performed somewhere in an external module to which you do not have access to edit, and the third point is already performed by the user of current module.

## Passing of providers to the DI registry

For one dependency, you need to transfer one or more providers to the DI registry. Most often, providers are passed to the DI registry via module metadata, although sometimes they are passed via controller metadata, or even directly to [injectors][102]. In the following example, `SomeService` is passed into the `providersPerMod` array:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController],
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

After such a passing, consumers of providers can use `SomeService` within `SomeModule`. The identical result will be if we pass the same provider in object format:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController],
  providersPerMod: [
    { token: SomeService, useClass: SomeService }
  ],
})
export class SomeModule {}
```

And now let's additionally pass another provider with the same token, but this time in the controller metadata:

```ts {8}
import { controller } from '@ditsmod/core';

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

Pay attention to the highlighted line. This is how we say DI: "If this controller has a dependency on a provider with token `SomeService`, it should be substituted with an instance of class `OtherService`". This substitution will be valid only for this controller. All other controllers in `SomeModule` will receive `SomeService` class instances by `SomeService` token.

Similar substitution can be done at the application level and at the module level. This may sometimes be necessary, for example, when you want to have default configuration values at the application level, but custom values of this configuration at the level of a specific module. In this case, pass the default configuration in the root module first:

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

And in a certain module, we substitute `ConfigService` with an arbitrary value:

```ts {6}
import { featureModule } from '@ditsmod/core';
import { ConfigService } from './config.service.js';

@featureModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Re-adding providers

Different providers with the same token can be added multiple times in the metadata of a module or controller, but DI will choose the last provider added (there is an exception to this rule, but it only applies to multi-providers):

```ts
import { featureModule } from '@ditsmod/core';

@featureModule({
  providersPerMod: [
    { token: 'token1', useValue: 'value1' },
    { token: 'token1', useValue: 'value2' },
    { token: 'token1', useValue: 'value3' },
  ],
})
export class SomeModule {}
```

In this case, within the `SomeModule`, `value3` will be returned at the module, route, or request level for `token1`.

In addition, different providers with the same token can be passed at the same time at different levels of the hierarchy, but DI will always choose the closest injectors (i.e., if a value for a provider is queried at the request level, then the injector at the request level will be looked up first, and only if there is no required provider, DI will rise to the parent injectors):

```ts
import { featureModule } from '@ditsmod/core';

@featureModule({
  providersPerMod: [{ token: 'token1', useValue: 'value1' }],
  providersPerRou: [{ token: 'token1', useValue: 'value2' }],
  providersPerReq: [{ token: 'token1', useValue: 'value3' }],
})
export class SomeModule {}
```

In this case, within the `SomeModule`, `value3` will be returned at the request level for `token1`, `value2` - at the route level, and `value1` - at the module level.

Also, if you import a specific provider from an external module and you have a provider with the same token in the current module, the local provider will have higher priority, provided they were passed at the same level of the injector hierarchy.

## Editing values in the DI registry

As mentioned earlier, _providers_ are passed to the DI registry, from which _values_ are then formed to finally have a mapping between the token and its value:

```
token1 -> value15
token2 -> value100
...
```

There is also an option to edit the ready _values_ of the DI register:

```ts {4}
import { Injector } from '@ditsmod/core';

const injector = Injector.resolveAndCreate([{ token: 'token1', useValue: undefined }]);
injector.setByToken('token1', 'value1');
injector.get('token1'); // value1
```

Note that in this case, the provider with `token1`, which has the value `undefined`, is transferred to the registry first, and only then do we change the value for that token. If you try to edit a value for a token that is not in the registry, DI will throw an error similar to the following:

```text
DiError: Setting value by token failed: cannot find token in register: "token1". Try adding a provider with the same token to the current injector via module or controller metadata.
```

In most cases, value editing is used by [interceptors][105] or [guards][106], as they thus transfer the result of their work to the registry:

1. [BodyParserInterceptor][16];
2. [BearerGuard][17].

As an alternative to the `injector.setByToken()` method, an equivalent expression can be used:

```ts {5}
import { KeyRegistry } from '@ditsmod/core';

// ...
const { id } = KeyRegistry.get('token1');
injector.setById(id, 'value1');
// ...
```

The advantage of using the `injector.setById()` method is that it is faster than the `injector.setByToken()` method, but only if you get the ID from the `KeyRegistry` once and then use `injector.setById()` the many times.

## The fromSelf and skipSelf decorators

These decorators are used to control the behavior of the injector when searching for values for a particular token. They make sense in the case where there is a certain hierarchy of injectors.

### fromSelf

The decorator `fromSelf` is used very rarely.

```ts
import { injectable, fromSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@fromSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

const service2 = parent.get(Service2) as Service2;
service2.service1 instanceof Service1; // true

child.get(Service2); // Error - Service1 not found
```

As you can see, `Service2` depends on `Service1`, and the `fromSelf` decorator tells DI: "When creating an instance of `Service1`, use only the same injector that will create an instance of `Service2`, and do not need to refer to the parent injector". When the parent injector is created, it is passed both required services, so when the `Service2` token is requested, it will successfully resolve the dependency and issue an instance of this class.

But when creating a child injector, `Service1` was not passed to it, so when requesting a `Service2` token, it will not be able to resolve the dependency of this service. If you remove the `fromSelf` decorator from the constructor, the child injector will successfully resolve the `Service2` dependency.

### skipSelf

The `skipSelf` decorator is used more often than `fromSelf`, but also rarely.

```ts
import { injectable, skipSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@skipSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

parent.get(Service2); // Error - Service1 not found

const service2 = child.get(Service2) as Service2;
service2.service1 instanceof Service1; // true
```

As you can see, `Service2` depends on `Service1`, and the `skipSelf` decorator tells DI: "When creating an instance of `Service1`, skip the injector that will create an instance of `Service2` and immediately call the parent injector". When the parent injector is created, it is passed both necessary services, but because of `skipSelf` it cannot use the value for `Service1` from its own registry, so it will not be able to resolve the specified dependency.

And when creating a child injector, `Service1` was not passed to it, but it can turn to the parent injector for it. Therefore, the child injector will successfully resolve the `Service2` dependency.

## When DI can't find the right provider

Remember that when DI cannot find the right provider, there are only three possible reasons:

1. you did not transfer the required provider to DI in the metadata of the module or controller (well, or in the case of testing - in `Injector.resolveAndCreate()`);
2. you did not import the module where the provider you need is transferred, or this provider is not exported;
3. you are requesting a provider from the parent injector to the child injector.


[1]: https://en.wikipedia.org/wiki/Dependency_injection
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/tsconfig.json#L31
[13]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/package.json#L53
[14]: https://github.com/tc39/proposal-decorators
[15]: https://en.wikipedia.org/wiki/Singleton_pattern
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[107]: /developer-guides/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #passing-of-providers-to-the-di-registry
[101]: #hierarchy-and-encapsulation-of-injectors
[102]: #injector
[103]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
[104]: /components-of-ditsmod-app/extensions/#group-of-extensions
[105]: /components-of-ditsmod-app/http-interceptors/
[106]: /components-of-ditsmod-app/guards/
