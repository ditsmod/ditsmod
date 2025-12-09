---
sidebar_position: 1
---

# Dependency Injection

## Prerequisites {#prerequisites}

In the following examples of this section, it is assumed that you have cloned the [ditsmod/rest-starter][101] repository. This will allow you to get a basic configuration for the application and experiment in the `src/app` folder of that repository.

Additionally, if you don't yet know what exactly reflector does and what "dependency resolution" is, we recommend that you first read the previous section [Decorators and Reflector][108].

## Injector, tokens and providers {#injector-and-providers}

In the [previous section][108], we saw how a constructor can specify the dependency of one class on another class, and how a dependency chain can be automatically determined using a reflector. Now let's get acquainted with the **injector** — a mechanism that, in particular, allows obtaining class instances while considering their dependencies. The injector works very simply: it takes a **token** and returns a value for that token. Obviously, such functionality requires instructions linking what is requested from the injector to what it provides. These instructions are supplied by so-called **providers**.

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
const service3 = injector.get(Service3); // Instance of Service3
service3 === injector.get(Service3); // true
```

As you can see, the `Injector.resolveAndCreate()` method takes an array of providers as input and outputs an **injector** that can create an instance of each provided class using the `injector.get()` method, taking into account the entire dependency chain (`Service3` -> `Service2` -> `Service1`).

So, what tasks does the injector handle, and what does its `injector.get()` method do:

1. When the injector is created, it receives an array of providers — that is, an array of instructions defining what is requested from it (by token) and what it should return (the value). This stage is very important for the further operation of the injector. If you do not provide all required providers, the injector will not have the appropriate instructions when you request a particular token.
2. After the injector is created, when the token `Service3` is requested, it scans the provider array and sees the instruction `{ token: Service3, useClass: Service3 }`, so it "understands" that for the `Service3` token it must return an instance of the `Service3` class.
3. It then inspects the constructor of the `Service3` class and sees the dependency on `Service2`.
4. In the previous step, essentially, the `Service2` token is being requested, so the injector scans the providers and finds the instruction `{ token: Service2, useClass: Service2 }`, so it "understands" that for the `Service2` token it must return an instance of the `Service2` class.
5. It then inspects the constructor of `Service2` and sees the dependency on `Service1`.
6. In the previous step, the `Service1` token is being requested, so the injector scans the providers and finds the instruction `{ token: Service1, useClass: Service1 }`, so it "understands" that for the `Service1` token it must return an instance of the `Service1` class.
7. It then inspects the constructor of `Service1`, finds no dependencies, and therefore creates the `Service1` instance first.
8. Next, it creates the `Service2` instance using the `Service1` instance.
9. And finally, it creates the `Service3` instance using the `Service2` instance.
10. If later the `Service3` instance is requested again, the `injector.get()` method will return the previously created `Service3` instance from the injector’s cache.

In conclusion, we can state that `injector.get()` indeed works very simply: it receives the `Service3` token and returns its value — the instance of the `Service3` class. But to operate this way, the injector first takes into account the array of providers supplied to it. Second, it considers the dependency chain of each provider.

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

// second-service.ts
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

1. **ValueProvider** - this type of provider has the `useValue` property which receives any value except `undefined`; DI will return it unchanged. Example of such provider:

   ```ts
   { token: 'token1', useValue: 'some value' }
   ```

2. **ClassProvider** - this type of provider has the `useClass` property which receives a class whose instance will be used as the value of this provider. Example of such provider:

   ```ts
   { token: 'token2', useClass: SomeService }
   ```

3. **FactoryProvider** - this type of provider has the `useFactory` property which can accept arguments of two types:

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

     Then the provider should be passed to the DI registry in the following format:

     ```ts
     { token: 'token3', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
     ```

     First DI will create an instance of that class, then call its method and get the result, which will be associated with the specified token. The method of the specified class may return any value except `undefined`.

   * **FunctionFactoryProvider** implies that a function can be passed to `useFactory`, which may have parameters — i.e., it may have dependencies. These dependencies must be explicitly specified in the `deps` property as an array of tokens, and the order of tokens is important:

     ```ts {6}
     function fn(service1: Service1, service2: Service2) {
       // ...
       return 'some value';
     }

     { token: 'token3', deps: [Service1, Service2], useFactory: fn }
     ```

     Note that the `deps` property should contain the *tokens* of providers, and DI interprets them as tokens, not as providers. That is, for these tokens you will still need to provide the corresponding providers in the DI registry. Also note that decorators for parameters (for example `optional`, `skipSelf`, etc.) are not passed in `deps`. If your factory requires parameter decorators, you need to use the `ClassFactoryProvider`.

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

child.get(Service1); // OK
parent.get(Service1); // OK

parent.get(Service1) === child.get(Service1); // true

child.get(Service2); // OK
parent.get(Service2); // OK

parent.get(Service2) === child.get(Service2); // false

child.get(Service3); // OK
parent.get(Service3); // Error - No provider for Service3!

child.get(Service4); // Error - No provider for Service4!
parent.get(Service4); // Error - No provider for Service4!
```

As you can see, when creating the child injector, `Service1` was not passed to it, so when requesting an instance of this class it will refer to the parent. By the way, there is one non-obvious but very important point here: through the `get()` method, child injectors only request certain instances of classes from parent injectors — they do not create them by themselves. That's why this expression returns `true`:

```ts
parent.get(Service1) === child.get(Service1); // true
```

Because this is a very important feature in the injector hierarchy, let's describe it again: the value of a given provider is stored in the injector to which that provider was passed. That is, if `Service1` was not passed to the child injector when it was created, then `child.get(Service1)` may return an instance of `Service1`, but it will be created in the parent injector. And after the instance of `Service1` is created in the parent injector, the same instance will be returned (from the cache) on subsequent requests either via `child.get(Service1)` or via `parent.get(Service1)`. This is also an important feature because it determines where the state of a particular provider will be stored.

When we look at the behavior of injectors when requesting `Service2`, they will behave differently because both injectors were provided with the `Service2` provider during their creation, so each will create its own local version of this service; this is precisely why the expression below returns `false`:

```ts
parent.get(Service2) === child.get(Service2); // false
```

When we request `Service3` from the parent injector, it cannot create an instance of `Service3` because it has no connection to the child injector where `Service3` is present.

And neither injector can return an instance of `Service4`, because this class was not passed to any of them during their creation.

### Chain of dependencies at different levels {#chain-of-dependencies-at-different-levels}

The dependency chain of providers can be quite complex, and the injector hierarchy adds even more complexity. Let’s start with a simple case and then make it more complex. In the following example, `Service` depends on `Config`, and both providers are passed to the same injector:

```ts {14-15,19}
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
  // Empty array
]);

parent.get(Service).config; // returns { one: 1, two: 2 }
child.get(Service).config; // returns { one: 1, two: 2 } from parent injector
```

As you can see, this example creates both parent and child injectors, and both `Service` and its dependency `Config` are passed to the parent injector. In such a case, when the parent injector is asked for the value of the `Service` token, DI works according to the following logic:

1. first, the injector inspects the list of dependencies in `Service` and sees `Config`;
2. then the injector inspects the dependencies of `Config`, but that provider has no dependencies;
3. the instance of `Config` is created first, followed by the instance of `Service`.

When the child injector is created with an empty array of providers, any request from it will be delegated to the parent injector:

1. first, DI checks the child injector and does not find `Service`;
2. then the injector turns to the parent injector and receives the already created `Service` instance.

So far, everything is simple. Now let’s complicate the example by passing different values for the `Config` token to the parent and child injectors:

```ts {14-15,19}
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
```

When examining this example, remember that the parent injector cannot see its child injectors, so any change in the child injector does not affect the parent injector. In other words, for the parent injector, nothing changes here, because it receives exactly the same providers as in the previous example.

But what about the child injector? Now it has its own version of the provider with the `Config` token, which differs from the parent’s version. So how will the child injector behave when the following is requested?

```ts
child.get(Service).config;
```

It’s useful to think about this first on your own to better reinforce this behavior. Thought about it? Okay, the logic of this injector will be as follows:

1. first, DI checks the child injector and does not find `Service`;
2. then the injector turns to the parent injector and receives the already created `Service` instance. Therefore, this expression returns `{ one: 1, two: 2 }`.

A bit unexpected, right? Many people might assume that creating a `Service` instance would use the child’s local version of `Config`, which has the value `{ one: 11, two: 22 }`. But note that the child injector is asked for `Service` first, and since it doesn’t have it, it must turn to the parent injector for the `Service` instance. And because the parent injector resolves `Service`’s dependencies in its own context, it uses its own local version of `Config`, which has the value `{ one: 1, two: 2 }`.

However, when we request `Config` from the child injector instead of `Service`, it returns its own local value as expected:

```ts
child.get(Config); // { one: 11, two: 22 }
```

Can you guess what can be done so that when requesting `Service` from the child injector, you can obtain the local version of `Config`? — Correct: when creating the child injector, we can also pass `Service`, so that it will not turn to the parent injector:

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

As you can see, if you use `child.get(Service)` in this case, `Service` will be created with the `Config` from the parent injector. If you use `child.pull(Service)`, it will first pull the required provider into the child injector and then create it in the context of the child injector without adding its value to the injector cache (i.e., `child.pull(Service)` will return a new instance each time).

But if the requested provider exists in the child injector, then `child.pull(Service)` will work identically to `child.get(Service)` (with the addition that the provider's value is added to the injector's cache):

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

### Hierarchy of injectors in the Ditsmod application {#hierarchy-of-injectors-in-the-ditsmod-application}

Later in the documentation, you will encounter the following object properties that are passed through module metadata:

* `providersPerApp` - providers at the application level;
* `providersPerMod` - providers at the module level;
* `providersPerRou` - providers at the route level;
* `providersPerReq` - providers at the HTTP-request level.

Using these arrays, Ditsmod forms different injectors that are related by a hierarchical connection. Such a hierarchy can be simulated as follows:

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

Under the hood, Ditsmod performs a similar procedure many times for different modules, routes, and requests. For example, if a Ditsmod application has two modules and ten routes, there will be one injector at the application level, one injector for each module (2 total), one injector for each route (10 total), and one injector for each request. Injectors at the request level are removed automatically after each request is processed.

Recall that higher-level injectors in the hierarchy have no access to lower-level injectors. This means that **when passing a class to a specific injector, it’s necessary to know the lowest level in the hierarchy of its dependencies**.

For example, if you write a class that depends on the HTTP request, you will be able to pass it only to the `providersPerReq` array, because only from this array Ditsmod forms the injector to which Ditsmod will automatically add a provider with the HTTP-request object. On the other hand, an instance of this class will have access to all its parent injectors: at the route level, module level, and application level. Therefore, the class passed to the `providersPerReq` array can depend on providers at any level.

You can also write a class and pass it into the `providersPerMod` array; in that case it can depend only on providers at the module level or at the application level. If it depends on providers that you passed into `providersPerRou` or `providersPerReq`, you will get an error that these providers are not found.

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

Keep in mind that in this way you get the injector that created the instance of this service. The hierarchy level of that injector depends only on the registry in which `SecondService` was passed.

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
  { token: LOCAL, useValue: 'аа', multi: true }
]);

const locals = child.get(LOCAL); // ['аа']
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

As mentioned earlier, *providers* are passed to the DI registry, from which *values* are then formed, so that ultimately there is a mapping between token and its value:

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

But DI will ignore this optionality and will throw an error if it cannot create `FirstService`. For this code to work you need to use the `optional` decorator:

```ts {6}
import { injectable, optional } from '@ditsmod/core';
import { FirstService } from './first.service.js';

@injectable()
export class SecondService {
  constructor(@optional() private firstService?: FirstService) {}
  // ...
}
```

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

child.get(Service2); // Error - Service1 not found
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

parent.get(Service2); // Error - Service1 not found

const service2 = child.get(Service2) as Service2;
service2.service1 instanceof Service1; // true
```

As you can see, `Service2` depends on `Service1`, and the `skipSelf` decorator tells DI: "When creating an instance of `Service1`, skip the injector that will create the instance of `Service2` and immediately refer to the parent injector". When the parent injector is created, it is given both necessary services, but due to `skipSelf` it cannot use the value for `Service1` from its own registry, therefore it will not be able to resolve the specified dependency.

When creating the child injector, it was not passed `Service1`, but it can refer to the parent injector for it. Therefore the child injector successfully resolves the dependency for `Service2`.

## When DI can't find the right provider {#when-di-cant-find-the-right-provider}

Remember that when DI cannot find the required provider, there are only three possible reasons:

1. you did not pass the required provider to DI in module or controller metadata (or, in testing, to `Injector.resolveAndCreate()`);
2. you did not import the module that provides the required provider, or that provider is not exported;
3. you are requesting a provider from the parent injector that exists only in a child injector.

[1]: https://en.wikipedia.org/wiki/Dependency_injection
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/tsconfig.json#L31
[15]: https://en.wikipedia.org/wiki/Singleton_pattern
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[101]: ../../#installation
[102]: #injector-and-providers
[103]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
[104]: /components-of-ditsmod-app/extensions/#group-of-extensions
[105]: /components-of-ditsmod-app/http-interceptors/
[106]: /components-of-ditsmod-app/guards/
[107]: /developer-guides/exports-and-imports/
[108]: /components-of-ditsmod-app/decorators-and-reflector/
[121]: /components-of-ditsmod-app/providers-collisions/
