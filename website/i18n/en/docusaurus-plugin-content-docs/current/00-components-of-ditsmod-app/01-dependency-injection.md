---
sidebar_position: 1
---

# Dependency Injection

## Prerequisites {#prerequisites}

In the following examples of this section, it is assumed that you have cloned the [ditsmod/rest-starter][101] repository. This will allow you to get a basic configuration for the application and experiment in the `src/app` folder of that repository.

Additionally, if you don't yet know what exactly reflector does and what "dependency resolution" is, we recommend that you first read the previous section [Decorators and Reflector][108].

## Injector and providers {#injector-and-providers}

The injector is the main mechanism that implements the Dependency Injection pattern in Ditsmod. The ultimate goal of the injector is to return a value for a specific identifier called a **token**. In other words, the injector works very simply: it receives a token and returns the value associated with that token. Obviously, such functionality requires instructions that map what is being requested from the injector to what it should return. These instructions are provided by the so-called **providers**.

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
  Service1,
  Service2,
  Service3
]);
const service3 = injector.get(Service3); // Instance of Service3
service3 === injector.get(Service3); // true
```

As you can see, the `Injector.resolveAndCreate()` method takes an array of classes as input and returns an **injector** that can create an instance of each provided class via the `injector.get()` method, taking into account the entire dependency chain (`Service3` -> `Service2` -> `Service1`).

So, what are the tasks of the injector, and what exactly does its `injector.get()` method do:

1. When creating an injector, you pass it an array of providers — that is, an array of instructions mapping what is requested from it (the token) to what it should return (the value). In this case, the providers are the classes `[Service1, Service2, Service3]`. But where are the “instructions”? The point is that when creating an injector, the most compact way is to pass providers in the form of classes, which under the hood are then transformed into instructions like this: `[{ token: Service1, useClass: Service1 }, { token: Service2, useClass: Service2 }, { token: Service3, useClass: Service3 }]`. This step is very important for the injector’s further operation. If you don’t pass all the required providers, the injector will not have the corresponding instructions when you request a specific token.
2. When the injector is asked for the `Service3` token, it inspects the constructor of this class and sees a dependency on `Service2`.
3. Then it inspects the constructor of `Service2` and sees a dependency on `Service1`.
4. Then it inspects the constructor of `Service1`, finds no dependencies, and therefore first creates an instance of `Service1`.
5. Next, it creates an instance of `Service2` using the `Service1` instance.
6. And finally, it creates an instance of `Service3` using the `Service2` instance.
7. If the `Service3` instance is requested again later, the `injector.get()` method will return the previously created instance of `Service3` from the injector’s cache.

Now let’s break rule 1 and try to pass an empty array when creating the injector. In that case, calling `injector.get()` will throw an error:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

As expected, when we pass an empty array instead of a provider array, and then request the `Service3` token from the injector, the injector throws an error, requiring a **provider** for that token.

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

As you can see, now when creating the injector, instead of classes we passed an array of objects. These objects are also called **providers**. Each provider is an instruction for the DI:

1. If the token `Service1` is requested, return the text `value for Service1`.
2. If the token `Service2` is requested, first create an instance of `Service2`, and then return it.
3. If the token `Service3` is requested, execute the provided function that returns the text `value for Service3`.
4. If the token `Service4` is requested, return the value for the `Service3` token, meaning the text `value for Service3`.

Now that we have passed the providers to the injector in the form of instructions, it becomes clearer that the injector needs these instructions to map what it is being asked for (the token) to what it should provide (the value). In the documentation, such a mapping may also be referred to as the **injector registry**. For the injector, a **token** is an identifier used to look up a value in its registry. While scanning a class's dependencies, the [reflector][108] returns tokens rather than providers, which means the injector cannot rely solely on the reflector without also being given the providers. Therefore, when creating an injector, you must supply providers containing the tokens that will be requested from it, particularly through `injector.get()`.

Since this is very important, let's restate how DI works, but in different words. When the injector is created, it receives providers that serve as instructions mapping tokens to the values that should be returned for those tokens. As you can see in the previous code example, providers are passed to `Injector.resolveAndCreate()`, and as the name of this method suggests, dependency **resolution** happens first. And what is "dependency resolution"? This is the process of scanning each provider using the [reflector][108] and determining the list of tokens whose values that provider depends on. Once the injector has been created, the reflector is no longer used, which is why `injector.get()` in the following example throws an error:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

By the way, another reason why the reflector is not used during `injector.get()` calls is that a provider token can be something other than a class — for example, it can be a primitive type. The complete list of possible token types is as follows:

1. A class.
2. Any object, except for `null` and arrays. It is recommended to use an instance of the `InjectionToken<T>` class as a token, since it is a generic that takes a type parameter `T`. This parameter can be used to associate the token with the value that will be returned from the injector registry.
3. A `string`, `number`, or `symbol`.

It’s important to remember that tokens operate in JavaScript code, not in TypeScript code, which means entities declared with keywords such as `interface`, `type`, `declare`, `enum`, etc. cannot be used as tokens, since they will not exist in the JavaScript code after compilation. In addition, tokens cannot be imported using the `type` keyword, because such an import will not appear in the JavaScript code.

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

If the provider is represented as an object, it can have the following types:

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

4. **TokenProvider** - this type of provider has the `useToken` property which receives another token. If you write:

   ```ts
   { token: SecondService, useToken: FirstService }
   ```

   you are telling DI: "When consumers request the token `SecondService`, use the value for the token `FirstService`". In other words, this directive creates an alias `SecondService` that points to `FirstService`.

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

For example, if you write a class that depends on the HTTP request, you will be able to pass it only to the `providersPerReq` array, because only from this array Ditsmod forms the injector to which Ditsmod will automatically add a provider with the HTTP-request object. On the other hand, an instance of this class will have access to all its parent injectors: at the route level, module level, and application level. Therefore this class can depend on providers at any level.

You can also write a class and pass it into the `providersPerMod` array; in that case it can depend only on providers at the module level or at the application level. If it depends on providers that you passed into `providersPerRou` or `providersPerReq`, you will get an error that these providers are not found.

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
2. then pass that class as `ClassProvider`;
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
