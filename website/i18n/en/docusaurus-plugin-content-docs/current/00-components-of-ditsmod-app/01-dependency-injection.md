---
sidebar_position: 1
---

# Dependency Injection

In the following examples of this section, it is assumed that you have cloned the [ditsmod/rest-starter][101] repository. This will allow you to get a basic configuration for the application and experiment in the `src/app` folder of that repository.

## Injector and providers {#injector-and-providers}

Let's look at the following example with an injector and providers:

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

As you can see, the `Injector.resolveAndCreate()` method takes an array of classes as input and returns an injector that can create an instance of each provided class via the `injector.get()` method, taking into account the entire dependency chain (`Service3` -> `Service2` -> `Service1`).

What `injector.get()` does:

- when `Service3` is requested, it inspects the constructor of that class and sees a dependency on `Service2`;
- then it inspects the constructor of `Service2` and sees a dependency on `Service1`;
- then it inspects the constructor of `Service1`, finds no dependencies there, and therefore creates an instance of `Service1` first;
- then it creates an instance of `Service2` using the instance of `Service1`;
- and finally it creates an instance of `Service3` using the instance of `Service2`;
- if the instance `Service3` is requested again later, `injector.get()` will return the previously created `Service3` instance from this injector's cache.

An important feature here is that DI can read the dependency chain of `Service3` using the reflector without passing an array of the specified classes to the injector, but `injector.get()` will throw an error in such a case if you try to obtain an instance of a class:

```ts
const injector = Injector.resolveAndCreate([]);
const service3 = injector.get(Service3); // Error: No provider for Service3!
```

Why does this happen? To better understand this, let's rewrite the previous example by passing providers to the injector in another form:

```ts {16-18}
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
  { token: Service3, useClass: Service3 },
]);
const service1 = injector.get(Service1); // instance of Service1
const service2 = injector.get(Service2); // instance of Service2
const service3 = injector.get(Service3); // instance of Service3
```

As you can see, now when creating the injector, instead of classes we passed an array of objects. These objects are also called **providers**. Each provider is an instruction for the DI:

1. If the token `Service1` is requested, create an instance of `Service1` first and then return it.
2. If the token `Service2` is requested, create an instance of `Service2` first and then return it.
3. If the token `Service3` is requested, create an instance of `Service3` first and then return it.

Now that we passed providers to the injector as instructions, it becomes clearer that the injector needs instructions for mapping between what is requested (the token) and what it returns (the value). In the documentation this mapping may also be called the **provider registry**, because the instructions for mapping are supplied by providers. As for tokens — for the injector a token is an identifier used to find a value in the provider registry.

By the way, in the previous example, when we passed an array of classes, the injector treated them as providers as well. That is, providers can be in two forms: either a class, or an object with instructions for creating a particular value. This means both of the following injectors receive configurations with equivalent instructions:

```ts
const injector1 = Injector.resolveAndCreate([
  Service1,
  Service2,
  Service3,
]);
const injector2 = Injector.resolveAndCreate([
  { token: Service1, useClass: Service1 },
  { token: Service2, useClass: Service2 },
  { token: Service3, useClass: Service3 },
]);
```

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

     Note that the `deps` property should contain the *tokens* of providers, and DI interprets them as tokens, not as providers. That is, for these tokens you will still need to [provide the corresponding providers][100] in the DI registry. Also note that decorators for parameters (for example `optional`, `skipSelf`, etc.) are not passed in `deps`. If your factory requires parameter decorators, you need to use the `ClassFactoryProvider`.

4. **TokenProvider** - this type of provider has the `useToken` property which receives another token. If you write:

   ```ts
   { token: SecondService, useToken: FirstService }
   ```

   you are telling DI: "When consumers request the token `SecondService`, use the value for the token `FirstService`". In other words, this directive creates an alias `SecondService` that points to `FirstService`.

Now that you are familiar with the concept of a **provider**, it can be clarified that a **dependency** is a dependency on the **value of a provider**. Such a dependency is held by **consumers** of provider values either in service constructors, or in controllers' constructors or methods, or in the `get()` method of [injectors][102].

## Hierarchy and encapsulation of injectors  {#hierarchy-and-encapsulation-of-injectors}

DI provides the ability to create a hierarchy and encapsulation of injectors, involving parent and child injectors. It is thanks to hierarchy and encapsulation that the structure and modularity of an application are built. On the other hand, when encapsulation exists, there are rules that need to be learned to understand when one service can access a certain provider and when it cannot.

Let's consider the following situation. Imagine you need to create a default configuration for the entire application and a custom configuration for certain modules. This means that at the level of some modules you will change the configuration, and you need it not to affect the default value and other modules. The following pseudo-code shows the basic concept that provides such behavior:

```ts
// Parent injector
class PerApplicationInjector {
  locale = 'en'
  token1 = 'value1'
  token2 = 'value2'
  // ...
}

// Child injector
class PerModuleInjector {
  parent: perApplicationInjector;
  locale = 'uk'
}
```

A child injector can refer to a parent injector because it has the corresponding `parent` property with an instance of the parent injector. On the other hand, a parent injector has no access to a child injector, so it can only find values for those providers that were passed directly to it. This is a very important feature in the injector hierarchy, so we'll repeat it once more: child injectors can refer to parent injectors, and parent injectors cannot refer to child injectors.

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

Previously in the documentation you might have encountered the following properties of the object that is passed via module metadata:

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

Recall that higher-level injectors in the hierarchy have no access to lower-level injectors. This means that **when passing a class to a given injector, you must take into account the minimum hierarchy level of its dependencies**.

For example, if you write a class that depends on the HTTP request, you will be able to pass it only to the `providersPerReq` array, because only from this array Ditsmod forms the injector to which Ditsmod will automatically add a provider with the HTTP-request object. On the other hand, an instance of this class will have access to all its parent injectors: at the route level, module level, and application level. Therefore this class can depend on providers at any level.

You can also write a class and pass it into the `providersPerMod` array; in that case it can depend only on providers at the module level or at the application level. If it depends on providers that you passed into `providersPerRou` or `providersPerReq`, you will get an error that these providers are not found.

### Controller injector hierarchy {#controller-injector-hierarchy}

A controller [in injector-scoped mode][103], besides its own injector at the request level, also has three parent injectors: at the route level, module level and application level. These injectors are also formed based on the providers that you pass into the following arrays:

* `providersPerApp`;
* `providersPerMod`;
* `providersPerRou`;
* `providersPerReq` (this array forms the injector for a controller in injector-scoped mode).

Thus a controller in injector-scoped mode can depend on services at any level.

If a controller is [in context-scoped mode][103], its own injector is located at the module level, and it has one parent injector at the application level:

* `providersPerApp`;
* `providersPerMod` (this array forms the injector for a controller in context-scoped mode).

### Service injector hierarchy {#service-injector-hierarchy}

Unlike a controller, the injector of a given service can be at any level: at the application level, module level, route level, or request level. In practice this means that the provider for this service is passed into one (or several) of the above arrays. For example, in the following example `SomeService` is passed into the injector at the route level, and `OtherService` — into the module level:

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

In this case, if `SomeService` has a dependency on `OtherService`, DI will be able to create an instance of `SomeService`, because the injector at the route level can obtain an instance of `OtherService` from its parent injector at the module level. However, if `OtherService` depends on `SomeService`, DI will not be able to create an instance of `OtherService`, because the injector at the module level does not see its child injector at the route level.

The following example shows four different ways to request an instance of `SomeService` using `injectorPer*.get()` directly or via class method parameters:

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

Here it is important to remember the following rule: the value for `SomeService` is created in the injector where the provider was passed, and this value is created only once on the first request. In our example, the `SomeService` class is actually passed to `injectorPerRou`, so the instance of the class `SomeService` will be created in `injectorPerRou`, even if this instance is requested in the child `injectorPerReq`.

This rule is very important because it clearly shows:

1. in which injector the value for a given provider is created;
2. that if you take a single injector, the value for a given provider (for a given token) is created only once in it;
3. that if the child injector lacks a provider, it can ask the parent injector for the *value* of that provider (i.e., the child injector asks the parent injector for the *value*, not for the provider itself).

This rule applies to the `injector.get()` method, but not to `injector.pull()` or `injector.resolveAndInstantiate()`.

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

Essentially, multi-providers allow creating groups of providers that share the same token. This capability is used, for example, to create groups of `HTTP_INTERCEPTORS`, and also for creating various [extension groups][104].

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

## Transfer of providers to the DI registry {#transfer-of-providers-to-the-di-registry}

For a single dependency, one or more providers must be passed to the DI registry. Usually providers are passed to the DI registry via module metadata, although sometimes they are passed via controller metadata or even directly to [injectors][102]. In the following example `SomeService` is passed into the `providersPerMod` array:

```ts {9}
import { restModule } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@restModule({
  controllers: [SomeController],
  providersPerMod: [
    SomeService
  ],
})
export class SomeModule {}
```

After such a transfer, consumers of providers can use `SomeService` within `SomeModule`. The result will be identical if we pass the same provider in the object format:

```ts {9}
import { restModule } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { SomeController } from './some.controller.js';

@restModule({
  controllers: [SomeController],
  providersPerMod: [
    { token: SomeService, useClass: SomeService }
  ],
})
export class SomeModule {}
```

And now let's additionally pass another provider with the same token, but this time in the controller metadata:

```ts {8}
import { controller } from '@ditsmod/rest';

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

Pay attention to the highlighted line. Thus we tell DI: "If this controller has a dependency on the provider with the token `SomeService`, it should be substituted with an instance of the class `OtherService`". This substitution will apply only to this controller. All other controllers in `SomeModule` will receive instances of `SomeService` for the `SomeService` token.

You can perform a similar substitution at the application or module level. This can sometimes be useful, for example when you want to have default configuration values at the application level but custom values for that configuration at a specific module level. In that case, first pass the default configuration in the root module:

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

And then in some module substitute `ConfigService` with an arbitrary value:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { ConfigService } from './config.service.js';

@restModule({
  providersPerMod: [
    { token: ConfigService, useValue: { propery1: 'some value' } }
  ],
})
export class SomeModule {}
```

## Re-adding providers {#re-adding-providers}

Different providers with the same token can be added many times in module or controller metadata, but DI will choose the provider that was added last (exceptions to this rule apply only for multi-providers):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [
    { token: 'token1', useValue: 'value1' },
    { token: 'token1', useValue: 'value2' },
    { token: 'token1', useValue: 'value3' },
  ],
})
export class SomeModule {}
```

In this case, within `SomeModule` the `token1` will return `value3` at the module, route or request level.

Additionally, different providers with the same token can be provided at multiple different hierarchy levels simultaneously, but DI will always choose the nearest injector (i.e., if a provider value is requested at the request level, the injector at the request level will be inspected first, and only if the required provider is not found there will DI ascend to parent injectors):

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  providersPerMod: [{ token: 'token1', useValue: 'value1' }],
  providersPerRou: [{ token: 'token1', useValue: 'value2' }],
  providersPerReq: [{ token: 'token1', useValue: 'value3' }],
})
export class SomeModule {}
```

In this case, within `SomeModule` for `token1` the value `value3` will be returned at the request level, `value2` at the route level, and `value1` at the module level.

Also, if you import a provider from an external module and you have a provider with the same token in your current module, the local provider will have higher priority provided they were passed at the same hierarchy level.

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
[14]: https://github.com/tc39/proposal-decorators
[15]: https://en.wikipedia.org/wiki/Singleton_pattern
[16]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/body-parser/src/body-parser.interceptor.ts#L15
[17]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/examples/14-auth-jwt/src/app/modules/services/auth/bearer.guard.ts#L24

[101]: ../../#installation
[107]: /developer-guides/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #transfer-of-providers-to-the-di-registry
[102]: #injector-and-providers
[103]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
[104]: /components-of-ditsmod-app/extensions/#group-of-extensions
[105]: /components-of-ditsmod-app/http-interceptors/
[106]: /components-of-ditsmod-app/guards/
