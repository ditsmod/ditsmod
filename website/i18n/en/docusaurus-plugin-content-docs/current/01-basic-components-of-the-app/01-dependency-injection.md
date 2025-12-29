---
sidebar_position: 1
---

# Dependency Injection

## Prerequisites {#prerequisites}

In the following examples of this section, it is assumed that you have cloned the [ditsmod/rest-starter][101] repository. This will allow you to get a basic configuration for the application and experiment in the `src/app` folder of that repository.

Additionally, if you don't yet know what exactly reflector does and what "dependency resolution" is, we recommend that you first read the previous section [Decorators and Reflector][108].

## Injector, tokens and providers {#injector-and-providers}

In the [previous section][108], we saw how a constructor can specify the dependency of one class on another class, and how a dependency chain can be automatically determined using a reflector. Now let's get acquainted with the **injector** — a mechanism that allows obtaining class instances while considering their dependencies. The injector works very simply: it takes a **token** and returns a value for that token. Obviously, such functionality requires instructions linking what is requested from the injector to what it provides. These instructions are supplied by so-called **providers**.

Let's look at the following example, which slightly expands on the last example from the [Decorators and Reflector][108] section:

```ts {15-19}
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

const injector = Injector.resolveAndCreate([
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 }
]);
const service3 = injector.get(Service3); // instance of Service3
service3 === injector.get(Service3); // true
```

As you can see, the `Injector.resolveAndCreate()` method accepts an array of providers as input and returns an **injector** as output. This injector is capable of creating an instance of each provided class using the `injector.get()` method, taking into account the entire dependency chain (`Service3` -> `Service2` -> `Service1`).

So, what tasks does the injector perform, and what does its `injector.get()` method do:

1. During the creation of the injector, an array of providers is passed to it — that is, an array of instructions describing the relationship between what is requested from it (the token) and what it must return (the value). This stage is very important for the further functioning of the injector. If you do not pass all the required providers, the injector will not have the appropriate instructions when you request a certain token.
2. After the injector is created, when the `Service3` token is requested, it looks through the array of providers and finds the instruction `{ token: Service3, useClass: Service3 }`, so it "understands" that for the `Service3` token it must return an instance of the `Service3` class.
3. Then it inspects the constructor of the `Service3` class and sees a dependency on `Service2`.
4. Next, the injector looks through its array of providers and finds the instruction `{ token: Service2, useClass: Service2 }`, so it "understands" that for the `Service2` token it must return an instance of the `Service2` class.
5. Then it inspects the constructor of `Service2` and sees a dependency on `Service1`.
6. Next, the injector looks through the array of providers and finds the instruction `{ token: Service1, useClass: Service1 }`, so it "understands" that for the `Service1` token it must return an instance of the `Service1` class.
7. Then it inspects the constructor of `Service1`, finds no dependencies there, and therefore creates the `Service1` instance first.
8. Then it creates an instance of `Service2` using the `Service1` instance.
9. And finally, it creates an instance of `Service3` using the `Service2` instance.
10. If later the `Service3` instance is requested again, the `injector.get()` method will return the previously created `Service3` instance from this injector’s cache.

As a result, we can state that `injector.get()` really works very simply: it accepts the `Service3` token and returns its value — the instance of the `Service3` class. However, in order to work this way, the injector, first, takes into account the array of providers passed to it. Second, it considers the dependency chain of each provider.

Now let’s break rule 1 and try to pass an empty array when creating the injector. In that case, calling `injector.get()` will throw an error:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

As expected, when we pass an empty array instead of a provider array, and then request the `Service3` token from the injector, the injector throws an error, requiring a **provider** for that token.

By the way, the following two injectors receive equivalent providers:

```ts
const injector1 = Injector.resolveAndCreate([
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 }
]);
const injector2 = Injector.resolveAndCreate([
  Service1,
  Service2,
  Service3
]);
```

To better understand what providers can look like, let’s pass the injector an array of providers in the following form:

```ts {9-12}
import { Injector } from '@ditsmod/core';

class Service1 {}
class Service2 {}
class Service3 {}
class Service4 {}

const injector = Injector.resolveAndCreate([
  { token: Service1, useValue: 'value for Service1' },
  { token: Service2, useClass: Service2 },
  { token: Service3, useFactory: () => 'value for Service3' },
  { token: Service4, useToken: Service3 },
]);
injector.get(Service1); // value for Service1
injector.get(Service2); // instance of Service2
injector.get(Service3); // value for Service3
injector.get(Service4); // value for Service3
```

Note that in this example, the `injectable` decorator is not used, since each class shown here does not have a constructor where dependencies could be specified.

As you can see, during injector creation we have now passed an array of providers of four types. Later, each of these types will be formally described, but even without that, it is easy to guess what instructions these providers convey to the injector:

1. If the token `Service1` is requested, return the text `value for Service1`.
2. If the token `Service2` is requested, first create an instance of `Service2`, and then return it.
3. If the token `Service3` is requested, execute the provided function that returns the text `value for Service3`.
4. If the token `Service4` is requested, return the value for the `Service3` token, meaning the text `value for Service3`.

### Short and long forms of declaring dependencies in class methods {#short-and-long-forms-of-declaring-dependencies-in-class-methods}

If a class is used as the constructor parameter type, it can also be used as a token:

```ts {7}
import { injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {} // Short form of declaring a dependency
}
```

It is very important to understand that the token mechanism is needed for the JavaScript runtime, so you cannot use types declared in TypeScript with the keywords `interface`, `type`, `enum`, `declare`, etc. as tokens, because they do not exist in the JavaScript code. Additionally, tokens cannot be imported using the `type` keyword, because such an import will not appear in the JavaScript code.

Unlike a class, an array cannot be used simultaneously as a TypeScript type and as a token. On the other hand, a token may have a type completely unrelated to the dependency it is associated with, so, for example, a string-type token can be associated with a dependency that has any TypeScript type, including arrays, interfaces, enums, etc.

A dependency can be declared in either a short or a long form. In the last example, the **short form** of declaring a dependency is used, and it has significant limitations because in this way you can specify a dependency only on a particular *class*.

There is also a **long form** of declaring a dependency using the `inject` decorator, which allows you to use an alternative token:

```ts {10}
import { injectable, inject } from '@ditsmod/core';

interface InterfaceOfItem {
  one: string;
  two: number;
}

@injectable()
export class Service1 {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {} // Long form of declaring a dependency
  // ...
}
```

When `inject` is used, DI considers only the token passed to it. In this case, DI ignores the variable type `InterfaceOfItem[]` and uses the string `some-string` as the token. In other words, DI uses `some-string` as the key to look up the corresponding value for the dependency, and the parameter’s type — `InterfaceOfItem[]` — has no significance for DI at all. Thus, DI makes it possible to separate the token from the variable type, allowing the constructor to receive any type of dependency, including various array types or enums.

A token can be a reference to a class, object, or function; you can also use string or numeric values, as well as symbols, as tokens. For the long form of specifying dependencies, we recommend using an instance of the `InjectionToken<T>` class as the token, since the `InjectionToken<T>` class has a parameterized type `T` that allows specifying the type of data associated with the given token:

```ts {5,14}
// tokens.ts
import { InjectionToken } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';

const SOME_TOKEN = new InjectionToken<InterfaceOfItem[]>('SOME_TOKEN');

// service1.ts
import { injectable, inject } from '@ditsmod/core';
import { InterfaceOfItem } from './types.js';
import { SOME_TOKEN } from './tokens.js';

@injectable()
export class Service1 {
  constructor(@inject(SOME_TOKEN) private someArray: InterfaceOfItem[]) {}
  // ...
}
```

### Provider {#provider}

Formally, the provider type is represented by the following declaration:

```ts
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: any, useValue?: any, multi?: boolean } |
{ token: any, useClass: Class<any>, multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token?: any, useFactory: (...args: any[]) => any, deps: any[], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

*_note that the token for a provider with the `useFactory` property is optional, because DI can use the function or the method of the specified class as a token._

If the provider is represented as an object, its types can be imported from `@ditsmod/core`:

```ts
import { ValueProvider, ClassProvider, FactoryProvider, TokenProvider } from '@ditsmod/core';
```

More details about each of these types:

1. **ValueProvider** – this type of provider has a `useValue` property, to which any value except `undefined` is passed, and whose value will be used as the value of this provider. An example of such a provider:

   ```ts
   { token: 'token1', useValue: 'some value' }
   ```

2. **ClassProvider** - this type of provider has the `useClass` property which receives a class whose instance will be used as the value of this provider. Example of such provider:

   ```ts
   { token: 'token2', useClass: SomeService }
   ```

3. **FactoryProvider** - this type of provider has the `useFactory` property, and it has two subtypes:

   * **ClassFactoryProvider** (recommended, due to its better encapsulation) implies that a [tuple][11] is passed to `useFactory`, where the first element must be a class and the second element must be a method of that class which should return some value for the given token. For example, if the class is:

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

     In this case, the provider must be transmitted in the following format:

     ```ts
     { token: 'token3', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
     ```

     First, DI will create an instance of this class, then call its method and obtain the result, which will then be the value of this provider. The method of the specified class can return any value except `undefined`.

   * **FunctionFactoryProvider** implies that a function can be passed to `useFactory`, which may have parameters — i.e., it may have dependencies. These dependencies must be explicitly specified in the `deps` property as an array of tokens, and the order of tokens is important:

     ```ts {6}
     function fn(service1: Service1, service2: Service2) {
       // ...
       return 'some value';
     }

     { token: 'token3', deps: [Service1, Service2], useFactory: fn }
     ```

     Note that the `deps` property receives provider *tokens*, and DI treats them specifically as tokens, not as providers. That is, for these tokens, the corresponding providers still need to be passed in the providers array. Also note that [parameter decorators][103] (for example, `optional`, `skipSelf`, etc.) are not passed in `deps`. If your factory requires parameter decorators, you need to use `ClassFactoryProvider`.

4. **TokenProvider** — this provider type has a `useToken` property, into which another token is passed. If you write something like this:

   ```ts
   { token: Service2, useToken: Service1 }
   ```

   You are telling DI: “When provider consumers request the `Service2` token, the value for the `Service1` token should be used”. In other words, this directive creates an alias `Service2` that points to `Service1`. Therefore, a `TokenProvider` is not self-sufficient, unlike other provider types, and it must ultimately point to another provider type — a `TypeProvider`, `ValueProvider`, `ClassProvider`, or `FactoryProvider`:

   ```ts {4}
   import { Injector } from '@ditsmod/core';

   const injector = Injector.resolveAndCreate([
     { token: 'token1', useValue: 'some value for token1' }, // <-- non TokenProvider
     { token: 'token2', useToken: 'token1' },
   ]);
   console.log(injector.get('token1')); // some value for token1
   console.log(injector.get('token2')); // some value for token1
   ```

   Here, when creating the injector, a `TokenProvider` is passed that points to a `ValueProvider`, which is why this code will work. If you don’t do this, DI will throw an error:

   ```ts
   import { Injector } from '@ditsmod/core';

   const injector = Injector.resolveAndCreate([
     { token: 'token1', useToken: 'token2' },
   ]);
   injector.get('token1'); // Error! No provider for token2! (token1 -> token2)
   // OR
   injector.get('token2'); // Error! No provider for token2!
   ```

   This happens because you are telling DI: “If someone requests `token1`, use the value for `token2`”, but you do not provide a value for `token2`.

   On the other hand, your `TokenProvider` may point to another `TokenProvider` as an intermediate value, but ultimately a `TokenProvider` must always point to a provider of a different type:

   ```ts {4}
   import { Injector } from '@ditsmod/core';

   const injector = Injector.resolveAndCreate([
     { token: 'token1', useValue: 'some value for token1' }, // <-- non TokenProvider
     { token: 'token2', useToken: 'token1' },
     { token: 'token3', useToken: 'token2' },
     { token: 'token4', useToken: 'token3' },
   ]);
   console.log(injector.get('token4')); // some value for token1
   ```

   That is, the provider with `token4` has the following dependency chain: `token4` -> `token3` -> `token2` -> `token1`. That is why, when `token4` is requested from the injector, it ultimately returns the value for `token1`.

Now that you are familiar with the concept of a **provider**, it can be clarified that a **dependency** is a dependency on the **value of a provider**. Such a dependency is held by **consumers** of provider values either in service constructors, or in controllers' constructors or methods, or in the `get()` method of [injectors][102].

## Hierarchy and encapsulation of injectors  {#hierarchy-and-encapsulation-of-injectors}

DI provides the ability to create a hierarchy and encapsulation of injectors, involving parent and child injectors. It is thanks to hierarchy and encapsulation that the structure and modularity of an application are built. On the other hand, when encapsulation exists, there are rules that need to be learned to understand when one service can access a certain provider and when it cannot.

Let’s consider the following situation. Imagine that you need to create a default configuration for a logger that will be used throughout the entire application. However, for a specific module, you need to increase the log level, for example, to debug that particular module. This means that at the module level, you will modify the configuration, and you need to ensure that it does not affect the default value or other modules. This is exactly what the injector hierarchy is designed for. The highest level in the hierarchy is the application-level injector, from which the injectors for each module branch out. An important feature is that the higher-level injector does not have access to the lower-level injectors in the hierarchy. However, lower-level injectors can access higher-level ones. That’s why module-level injectors can, for example, obtain the logger configuration from the application-level injector if they do not receive an overridden configuration at the module level.

Let's look at the following example. For simplicity, decorators are not used at all here, because none of the classes has dependencies:

```ts {8-9}
import { Injector } from '@ditsmod/core';

class Service1 {}
class Service2 {}
class Service3 {}
class Service4 {}

const parent = Injector.resolveAndCreate([Service1, Service2]); // Parent injector
const child = parent.resolveAndCreateChild([Service2, Service3]); // Child injector

child.get(Service1); // instance of Service1
parent.get(Service1); // instance of Service1

parent.get(Service1) === child.get(Service1); // true

child.get(Service2); // instance of Service2
parent.get(Service2); // instance of Service2

parent.get(Service2) === child.get(Service2); // false

child.get(Service3); // instance of Service3
parent.get(Service3); // Error - No provider for Service3!

child.get(Service4); // Error - No provider for Service4!
parent.get(Service4); // Error - No provider for Service4!
```

As you can see, when creating the child injector, `Service1` was not passed to it, so when it is asked for the value of this token, it will take it from the parent injector. By the way, there is one non-obvious but very important point here: through the `get()` method, child injectors can request token values from parent injectors if necessary, and they do not create them on their own. That is why this expression returns `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

Since this is a very important characteristic of the injector hierarchy, let's describe it again: the value of a particular provider is stored in the injector to which the corresponding provider is passed. That is, if during the creation of the child injector the provider with the `Service1` token is not passed to it, then when `child.get(Service1)` is requested, the child injector will not create the value for the `Service1` token. Instead, the child injector will turn to the parent injector, where the provider with the `Service1` token was passed, and therefore the parent injector will be able to create the value for this token. And after the `Service1` instance is created in the parent injector, this same instance will be returned (from the cache) when requested again either through `child.get(Service1)` or through `parent.get(Service1)`.

When we look at the behavior of injectors when requesting `Service2`, they will behave differently because both injectors were provided with the `Service2` provider during their creation, so each will create its own local version of this service; this is precisely why the expression below returns `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

When we request `Service3` from the parent injector, it cannot create an instance of `Service3` because it has no connection to the child injector where `Service3` is present.

And neither injector can return an instance of `Service4`, because this class was not passed to any of them during their creation.

### Chain of dependencies at different levels {#chain-of-dependencies-at-different-levels}

The dependency chain of providers can be quite complex, and the injector hierarchy adds even more complexity. Let’s start with a simple case and then make it more complex. In the following example, `Service` depends on `Config`, and both providers are passed to the same injector:

```ts {14-15,18}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([]);

parent.get(Service); // Instance of Service
child.get(Service); // Instance of Service
```

As you can see, in this example both the parent and child injectors are created, and both `Service` and its dependency `Config` are provided only to the parent injector. In this case, when the parent injector is asked for the value of the provider with the `Service` token, it will operate according to the following logic:

1. First, it scans its provider array and finds `Service`, so it "knows" that when `Service` is requested, it must return an instance of this class.
2. Then it scans the list of dependencies of `Service` and finds `Config`.
3. Next, it scans its provider array and finds `{ token: Config, useValue: { one: 1, two: 2 } }`, so it "knows" that when `Config` is requested, it must return `{ one: 1, two: 2 }`.
4. It then scans the list of dependencies in the provider with the `Config` token and finds none.
5. Therefore, to create the `Service` instance, it will use the value `{ one: 1, two: 2 }`. Note that when creating the `Service` instance, the injector does not create an instance of `Config`; instead, it uses the ready-made object `{ one: 1, two: 2 }`, because these instructions were provided in the provider array when the parent injector was created.

When the child injector is created with an empty provider array, it will always delegate requests to the parent injector:

1. First, the child injector scans its provider array and finds no instructions.
2. Then the child injector forwards the request to the parent injector and receives the already-created `Service` instance.

In the case where we pass `Service` to one injector and `Config` to another, it becomes important to take into account the dependency between them. Therefore, such a setup will work only when `Config` is passed to the parent injector and `Service` to the child injector. Moreover, `Service` can be requested only from the child injector:

```ts {14,18}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([
  Service,
]);

child.get(Config); // { one: 1, two: 2 }
child.get(Service); // instance of Service

parent.get(Config); // { one: 1, two: 2 }
parent.get(Service); // Error: No provider for Service!
```

As you can see, the child injector can create an instance of `Service`, even though it requests `Config` from the parent injector. In contrast, the parent injector can provide only the value for `Config`, while the `Service` provider is unavailable to it, because the parent injector does not see the child injector where this provider exists.

Now let’s provide `Service` to the parent injector and `Config` to the child one. Keeping in mind that parent injectors never look into child injectors, can you guess what problems may arise with `Service`?

```ts {14,18}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
]);

const child = parent.resolveAndCreateChild([
  { token: Config, useValue: { one: 11, two: 22 } }
]);

child.get(Config); // { one: 11, two: 22 }

child.get(Service);
// Error: No provider for [Config in injector1]!
// Resolution path: [Service in injector2 >> injector1] -> [Config in injector1]

parent.get(Service);
// Error: No provider for Config!
// Resolution path: Service -> Config
```

As you can see, when the `Config` token is requested from the child injector, it returns the corresponding value, because during its creation it was provided with a provider for this token.

The situation is different with `Service`, which depends on `Config`. Despite the fact that the child injector was given a provider with the `Config` token, this injector still cannot create an instance of `Service`, so it is forced to delegate the request to the parent injector. At the same time, although the parent injector has a provider with the `Service` token, it does not have access to the child injector where `Config` exists. Therefore, when calling `child.get(Service)`, the error is actually thrown by the parent injector.

Pay attention to the `Resolution path` in the error message:

```ts
child.get(Service);
// Error: No provider for [Config in injector1]!
// Resolution path: [Service in injector2 >> injector1] -> [Config in injector1]
```

The `Resolution path` starts with searching for `Service` in `injector2` and then continues in `injector1`. Since this error was caused by the expression `child.get(Service)`, one can infer that `injector2` is the automatic name assigned by Ditsmod to the child injector. Accordingly, `injector1` is the parent injector. Remember that the highest injector in the hierarchy will always have the automatic name `injector1`, and the lower an injector is in the hierarchy, the larger the number at the end of its name `injectorN` will be.

But is it possible to explicitly specify injector names (or hierarchy levels)? Yes, it is possible by passing a second argument when creating an injector. Moreover, it is even recommended to always do this:

```ts {15,20}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate(
  [Service],
  'parentInjector'
);

const child = parent.resolveAndCreateChild(
  [{ token: Config, useValue: { one: 11, two: 22 } }],
  'childInjector'
);

child.get(Service);
// Error: No provider for [Config in parentInjector]!
// Resolution path: [Service in childInjector >> parentInjector] -> [Config in parentInjector]
```

In this case, the `Resolution path` becomes more clear:

1. first, `Service` is searched for in `childInjector`, then in `parentInjector`;
2. and since `Service` is found in `parentInjector`, its dependency — `Config` — will also be searched for in `parentInjector`.

By analyzing the error message, one can infer that the problem can be solved in two ways:

1. either add `Service` to `childInjector` so that it does not elevate to `parentInjector`;
2. or add `Config` to `parentInjector` so that it can resolve the dependency for `Service`.

Let us use the second option:

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

const parent = Injector.resolveAndCreate(
  [
    Service,
    { token: Config, useValue: { one: 1, two: 2 } }
  ],
  'parentInjector'
);

const child = parent.resolveAndCreateChild(
  [{ token: Config, useValue: { one: 11, two: 22 } }],
  'childInjector'
);
```

Here, the parent injector has both required providers to create an instance of `Service`. But what about the child injector? Which version of `Config` will be used to create the instance of `Service` in the following expression?

```ts
child.get(Service);
```

It is useful to think about this on your own first, to better solidify this behavior in memory. Thought about it? OK, the logic in the child injector will be as follows:

1. first, it will scan its own providers array and will not find a provider with the `Service` token;
2. then it will delegate to the parent injector and receive from it an already created instance of `Service`, in which `Config` will have the value `{ one: 1, two: 2 }`.

A bit unexpected, right? Some might have thought that the child injector would use the local version of `Config` (that is, `{ one: 11, two: 22 }`) to create the instance of `Service`. Can you guess what can be done so that when requesting `Service` from the child injector, DI resolves its dependency using the local version of the provider with the `Config` token? Yes, when creating the child injector, we can also pass `Service` to it in the providers array:

```ts {19}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
  { token: Config, useValue: { one: 1, two: 2 } }
]);

const child = parent.resolveAndCreateChild([
  Service,
  { token: Config, useValue: { one: 11, two: 22 } }
]);
```

Now the child injector has both `Service` and `Config`, so it will not refer to the parent injector:

```ts
child.get(Service).config; // { one: 11, two: 22 }
```

### Method `injector.pull()` {#method-injector-pull}

This method makes sense to use only in a child injector when it lacks a certain provider that exists in the parent injector, and that provider depends on another provider that exists in the child injector.

For example, when `Service` depends on `Config`, and `Service` exists only in the parent injector, while `Config` exists both in the parent and in the child injector:

```ts {14-15,18}
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([
  Service,
  { token: Config, useValue: { one: 1, two: 2 } }
]);
const child = parent.resolveAndCreateChild([
  { token: Config, useValue: { one: 11, two: 22 } }
]);
child.get(Service).config; // returns from parent injector: { one: 1, two: 2 }
child.pull(Service).config; // pulls Service in current injector: { one: 11, two: 22 }
```

As you can see, if you use `child.get(Service)` in this case, `Service` will be created with the `Config` from the parent injector. If you use `child.pull(Service)`, it will first pull the required provider into the child injector and then create it in the context of the child injector without adding its value to the injector cache (i.e., `child.pull(Service)` will return a new instance each time).

But if the requested provider exists in the child injector, then `child.pull(Service)` will work identically to `child.get(Service)` (with the addition that the provider's value is added to the injector's cache):

```ts {15-16}
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
const child = parent.resolveAndCreateChild([
  Service,
  { token: Config, useValue: { one: 11, two: 22 } }
]);
child.get(Service).config; // { one: 11, two: 22 }
```

### Hierarchy of injectors in the Ditsmod application {#hierarchy-of-injectors-in-the-ditsmod-application}

Later in the documentation, you will encounter the following object properties that are passed through module metadata:

* `providersPerApp` - providers at the application level;
* `providersPerMod` - providers at the module level;
* `providersPerRou` - providers at the route level;
* `providersPerReq` - providers at the HTTP-request level.

Using these arrays, Ditsmod forms different injectors that are related by a hierarchical connection. Such a hierarchy can be simulated as follows:

```ts
import { Injector, Provider } from '@ditsmod/core';

const providersPerApp: Provider[] = [];
const providersPerMod: Provider[] = [];
const providersPerRou: Provider[] = [];
const providersPerReq: Provider[] = [];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp);
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
```

Under the hood, Ditsmod performs a similar procedure many times for different modules, routes, and HTTP requests. Using this example, let’s practice to better understand the injector hierarchy, and once again use the familiar `Service` class, which depends on `Config`:

```ts {13,16,23}
import { injectable, Injector, Provider } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const providersPerApp: Provider[] = [Service];
const providersPerMod: Provider[] = [];
const providersPerRou: Provider[] = [];
const providersPerReq: Provider[] = [Config];

const injectorPerApp = Injector.resolveAndCreate(providersPerApp, 'App');
const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod, 'Mod');
const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou, 'Rou');
const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq, 'Req');

injectorPerReq.get(Service);
// Error: No provider for [Config in App]!
// Resolution path: [Service in Req >> Rou >> Mod >> App] -> [Config in App]
```

As you can see, the injectors here are given abbreviated names for the hierarchy levels:

1. `App` - application level;
2. `Mod` - module level;
3. `Rou` - route level;
4. `Req` - request level.

The error was caused by the expression `injectorPerReq.get(Service)`, and as the `Resolution path` in this error tells us, `Service` was searched for at all levels of the injector hierarchy—from `Req` up to `App`. Then the search switched to `Config`, which was searched only at the `App` level.

If `Service` is provided at the module level:

```ts {2}
const providersPerApp: Provider[] = [];
const providersPerMod: Provider[] = [Service];
const providersPerRou: Provider[] = [];
const providersPerReq: Provider[] = [Config];
```

In this case, the error message will look like this:

```ts
injectorPerReq.get(Service);
// Error: No provider for [Config in Mod >> App]!
// Resolution path: [Service in Req >> Rou >> Mod] -> [Config in Mod >> App]
```

As the `Resolution path` in this error tells us, `Service` was searched for at three levels of the injector hierarchy—from `Req` up to `Mod`. But why didn’t the search continue to the `App` level? Because when the injectors were created, `Service` was provided specifically at the `Mod` level. And if all required providers had been present at this level, the `Service` instance would have been created right there. Then the search switched to `Config`, on which `Service` depends, and this search started from the same level where `Service` was found. The search for `Config` ended at the `App` level, whose injector threw the error stating that it could not find a provider for `Config`.

By analyzing the `Resolution path`, it is once again confirmed that provider lookup always proceeds from lower to higher levels of the injector hierarchy, and never the other way around.

You can probably guess what will happen when `Service` is provided at the route level:

```ts {3}
const providersPerApp: Provider[] = [];
const providersPerMod: Provider[] = [];
const providersPerRou: Provider[] = [Service];
const providersPerReq: Provider[] = [Config];
```

Yes, this expression still throws an error:

```ts
injectorPerReq.get(Service);
// Error: No provider for [Config in Rou >> Mod >> App]!
// Resolution path: [Service in Req >> Rou] -> [Config in Rou >> Mod >> App]
```

As the `Resolution path` in this error tells us, `Service` was searched for at two levels of the injector hierarchy — `Req` and `Rou`. And the providers for `Config` were searched for at the three upper levels — from `Rou` to `App`.

Finally, when `Service` is provided at the same level as `Config`, this expression will no longer throw errors:

```ts
const providersPerApp: Provider[] = [];
const providersPerMod: Provider[] = [];
const providersPerRou: Provider[] = [];
const providersPerReq: Provider[] = [Service, Config];
```

There will also be no errors when `Config` is provided at a higher level than the one where `Service` is provided. The expression `injectorPerReq.get(Service)` finally starts working, because `Service` is found immediately, and `Config` is found at the same level or higher.

When registering providers for creating injectors, you should always remember that **all providers on which a given service depends must be either at the same level as that service or at higher levels, since the search for the corresponding providers will always proceed from the level of that service upward**. In other words, providers on which a given service depends will never be searched for at lower levels relative to the level at which that service is provided.

### Current injector {#current-injector}

You will rarely need the injector of a service or controller itself, but you can obtain it in a constructor just like any other provider value:

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

Keep in mind that in this way you get the injector that created the instance of this service. The hierarchy level of this injector depends only on which injector array `SecondService` was passed to.

## Multi-providers {#multi-providers}

This kind of providers exist only in the object form and differ from regular DI providers by having the `multi: true` property. Such providers are appropriate when you need to pass several providers with the same token to DI at once so that DI returns the same number of values for these providers in a single array:

```ts
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // ['uk', 'en']
```

Essentially, multi-providers allow creating groups of providers that share the same token. This capability is used, for example, to create groups of `HTTP_INTERCEPTORS`.

It is not allowed for the same token to be both a regular provider and a multi-provider in the same injector:

```ts {5-6}
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk' },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // Error: Cannot mix multi providers and regular providers
```

Child injectors can return values of multi-providers from the parent injector only if, during their creation, they were not passed providers with the same tokens:

```ts
import { InjectionToken, Injector } from '@ditsmod/core';

const LOCAL = new InjectionToken('LOCAL');

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([]);

const locals = child.get(LOCAL); // ['uk', 'en']
```

If both the child and the parent injector have multi-providers with the same token, the child injector will return only the values from its own array:

```ts
import { Injector } from '@ditsmod/core';
import { LOCAL } from './tokens.js';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([
  { token: LOCAL, useValue: 'aa', multi: true }
]);

const locals = child.get(LOCAL); // ['aa']
```

### Multi-provider substitution {#multi-provider-substitution}

To make it possible to substitute a specific multi-provider, you can do the following:

1. pass a class to the multi-provider object using the `useToken` property;
2. then pass that class as `ClassProvider` or `TypeProvider`;
3. next in the providers array add a provider that substitutes that class.

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

This construction makes sense, for example, if the first two points are executed in an external module that you cannot edit, and the third point is executed by the user of the current module.

## Editing values in the DI register {#editing-values-in-the-di-register}

When creating an injector, it is passed an array of providers, which is then converted into the so-called **provider registry**. Schematically, this registry can be represented as follows:

```
token1 -> value15
token2 -> value100
...
```

In addition, it is possible to edit ready *values* in the DI registry:

```ts {4}
import { Injector } from '@ditsmod/core';

const injector = Injector.resolveAndCreate([{ token: 'token1', useValue: undefined }]);
injector.setByToken('token1', 'value1');
injector.get('token1'); // value1
```

Note that in this case a provider with `token1` and the value `undefined` is first passed to the registry, and only then do we change the value for this token. If you try to edit the value for a token that is not present in the registry, DI will throw an error similar to:

```text
DiError: Setting value by token failed: cannot find token in register: "token1". Try adding a provider with the same token to the current injector via module or controller metadata.
```

In most cases, editing values is used by [interceptors][105] or [guards][106], as they thus pass the result of their work into the registry:

1. [BodyParserInterceptor][16];
2. [BearerGuard][17].

As an alternative to the `injector.setByToken()` method, you can use the equivalent expression:

```ts {5}
import { KeyRegistry } from '@ditsmod/core';

// ...
const { id } = KeyRegistry.get('token1');
injector.setById(id, 'value1');
// ...
```

The advantage of using the `injector.setById()` method is that it is faster than `injector.setByToken()`, but only if you get the ID from the `KeyRegistry` once and then call `injector.setById()` many times.

## Decorators `optional`, `fromSelf` and `skipSelf` {#optional-fromSelf-skipSelf-decorators}

These decorators are used to control the behavior of the injector when searching for values for a given token.

### optional {#optional}

Sometimes you may need to mark a dependency in the constructor as optional. Let's look at the following example where a question mark is placed after the `firstService` property, indicating to TypeScript that this property is optional:

```ts {6}
import { injectable } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(private firstService?: FirstService) {}
  // ...
}
```

However, since DI works in JavaScript code rather than in TypeScript, it will ignore this optionality and will throw an error if there is no provider with the `FirstService` token. For this code to work you need to use the `optional` decorator:

```ts {6}
import { injectable, optional } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

Since JavaScript has no notion of an “optional property”, this can only be indicated by using decorators.

### fromSelf {#fromSelf}

The `fromSelf` and `skipSelf` decorators make sense when there is some hierarchy of injectors. The `fromSelf` decorator is used very rarely.

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

child.get(Service2);
// Error: No provider for Service1!
// Resolution path: Service2 -> Service1
```

As you can see, `Service2` depends on `Service1`, and the `fromSelf` decorator tells DI: "When creating an instance of `Service1`, use only the same injector that creates the instance of `Service2`, and do not refer to the parent injector". When the parent injector is created, it is given both required services, so when requesting the token `Service2` it will successfully resolve the dependency and return an instance of that class.

But when creating the child injector, `Service1` was not passed to it, so when requesting the token `Service2` it will not be able to resolve that service's dependency. If you remove the `fromSelf` decorator from the constructor, then the child injector will successfully resolve the dependency for `Service2`.

### skipSelf {#skipSelf}

The `skipSelf` decorator is used more often than `fromSelf`, but still rarely.

```ts
import { injectable, skipSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@skipSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

const service2 = child.get(Service2) as Service2;
service2.service1 instanceof Service1; // true

parent.get(Service2);
// Error: No provider for Service1!
// Resolution path: Service2 -> Service1
```

As you can see, `Service2` depends on `Service1`, and the `skipSelf` decorator tells DI: "When creating an instance of `Service1`, skip the injector that will create the instance of `Service2` and immediately refer to the parent injector". When the parent injector is created, it is given both necessary services, but due to `skipSelf` it cannot use the value for `Service1` from its own registry, therefore it will not be able to resolve the specified dependency.

When creating the child injector, it was not passed `Service1`, but it can refer to the parent injector for it. Therefore the child injector successfully resolves the dependency for `Service2`.

[1]: https://en.wikipedia.org/wiki/Dependency_injection
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/tsconfig.json#L31
[15]: https://en.wikipedia.org/wiki/Singleton_pattern
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[101]: ../../#installation
[102]: #injector-and-providers
[103]: #optional-fromSelf-skipSelf-decorators
[104]: /basic-components-of-the-app/extensions/#group-of-extensions
[105]: /rest-application/http-interceptors/
[106]: /rest-application/guards/
[107]: /developer-guides/exports-and-imports/
[108]: /basic-components-of-the-app/decorators-and-reflector/
[121]: /basic-components-of-the-app/providers-collisions/
