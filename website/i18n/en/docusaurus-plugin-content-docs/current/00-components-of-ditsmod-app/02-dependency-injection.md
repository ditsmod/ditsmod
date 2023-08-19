---
sidebar_position: 2
---

# Dependency Injection

## Why do you need DI?

Let's first get a general idea of how [Dependency Injection][1] (or just DI) works, and then look at each important component in detail.

It's probably easiest to understand exactly what DI does with examples. In this case, we need a `doSomething()` method that will be used in many places in our program:

```ts
// services.ts
export class Service1 {}

export class Service2 {
  constructor(service1: Service1) {}
}

export class Service3 {
  constructor(service2: Service2) {}

  doSomething(param1: any) {
    // ...
  }
}
```

So far, `service3.doSomething()` is used quite simply:

```ts {5-8}
import { Service1, Service2, Service3 } from './services';

export class SomeService {
  method1() {
    const service1 = new Service1();
    const service2 = new Service2(service1);
    const service3 = new Service3(service2);
    service3.doSomething(123);
  }
}
```

Now imagine a task that requires the `Service3` constructor to take two parameters. Also imagine that `Service3` is used in 20 other files in our program. We need to go through all of those files to make the appropriate update.

All this work could not have happened, if we had not relied on the specific implementation of creating the `Service3` instance. In fact, it is not important to us how many parameters the `Service3` constructor has, the main thing for us is the use of an instance of this class.

The following example is almost the same as the previous one, where we also declared the `Service3` class, but here we have added an `injectable` decorator above each class that has a constructor with parameters:

```ts {6,11}
// services.ts
import { injectable } from '@ditsmod/core';

export class Service1 {}

@injectable()
export class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
export class Service3 {
  constructor(service2: Service2) {}

  doSomething(param1: any) {
    // ...
  }
}
```

For now, you may not know what exactly the `injectable` decorator does, it's more important to know how we can now request a `Service3` instance anywhere in our program:

```ts {4,6,9}
import { injectable } from '@ditsmod/core';
import { Service3 } from './services';

@injectable()
export class SomeService {
  constructor(private service3: Service3) {}

  method1() {
    this.service3.doSomething(123);
  }
}
```

As you can see, we no longer create an instance of `Service3` using the `new` operator, instead, DI does this and passes the finished instance to the constructor. Even if the parameters in the `Service3` constructor are changed later, nothing will have to be changed in the places where `Service3` is used.

However, in order for DI to create an instance of the `Service3` class, we need to pass all the necessary classes in the array to the DI registry (this will be discussed later). DI is able to view the constructor parameters of each of these classes so that it can create and automatically substitute the appropriate class instances.

## The "magic" of working with metadata

From a JavaScript developer's point of view, the fact that DI can somehow look through the parameters of class constructors and see other classes there can be called "magic". If you look at the repository containing the starter project for Ditsmod applications, you can see that:

1. in the file `tsconfig.json` is specified ["emitDecoratorMetadata": true][12];
2. the `package.json` file specifies the dependency on the [reflect-metadata][13] library;
3. there are a number of decorators (`rootModule`, `featureModule`, `controller`, `injectable`...).

All of these components provide the "magic" of reading and storing the metadata that you write in your classes using decorators. You may not have a deep understanding of exactly how this "magic" works, but you should at least remember what its components are.

It's also worth noting that Ditsmod doesn't use [new decorators][14] because they don't yet have an API for handling method parameters.

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

If you forget to write (or intentionally remove) the `injectable` decorator before a class that has dependencies in the constructor, DI will throw an error saying that it cannot resolve the dependency of the given class. This is because `injectable` is involved in reading and saving class metadata.

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

Let's try to understand exactly how DI gets full information about the parameters of the class constructor. The following example shows a class whose constructor has three parameters, each of which has its own TypeScript type:

```ts
// ...
class MyService {
  constructor(
    private one: One,
    private two: Two,
    private three: Three,
  ) {
    // ...
  }
}
```

Now let's see what this class looks like when compiled into JavaScript code:

```ts
// ...
class MyService {
  one;
  two;
  three;

  constructor(one, two, three) {
    this.one = one;
    this.two = two;
    this.three = three;
  }
}
```

This means that TypeScript types disappear from constructor parameters in JavaScript code. So during compilation, TypeScript needs to generate a special function that saves the TypeScript types that we pass to the constructor parameters. This function can be something like the following:

```ts
function setConstructorTokens(tokens) {
  MyService.staticProperty = tokens;
}

setConstructorTokens([One, Two, Three]);
```

That's pretty much how it works. The TypeScript compiler automatically generates similar functions in any file that contains classes with decorators. Obviously, in our example, the `setConstructorTokens` function can only work with JavaScript values, it will not be able to take as arguments those types that we declare in the TypeScript code with the `interface`, `type`, etc. keywords, because they do not exist in the JavaScript code.

The JavaScript values accepted by `setConstructorTokens` are called **tokens**. You can pass the token in the short or long form of the specifying a dependency. Let's go back to the previous example:

```ts {7}
import { injectable } from '@ditsmod/core';

import { FirstService } from './first.service';

@injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}
  // ...
}
```

This is a **short form** of specifying a dependency, it has significant limitations because you can only specify a dependency on a specific _class_ this way. In this case, `FirstService` is used both as a variable type and as a token.

And there is a **long form** of specifying a dependency using the `inject` decorator, which allows you to use an alternative token:

```ts {7}
import { injectable, inject } from '@ditsmod/core';

import { InterfaceOfItem } from './types';

@injectable()
export class SecondService {
  constructor(@inject('some-string') private someArray: InterfaceOfItem[]) {}
  // ...
}
```

When `inject` is used, DI only considers the token passed to it. In this case, DI ignores the variable type - `InterfaceOfItem[]` - and uses the `some-string` as the token. Thus, DI allows you to separate token and variable type, so you can get any kind of dependency in the constructor, including different types of arrays or enums.

A token can be a reference to a class, object, or function, and primitive values other than `undefined` can also be used as tokens. For the long form of specifying dependencies, we recommend using an instance of the `InjectionToken<T>` class as the token, since the `InjectionToken<T>` class has a parameterized type `T` that can be used to specify the type of data associated with that token:

```ts {5,14}
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

## Providers

DI has a registry, which is essentially a mapping between a token and the value to be issued for that token. Schematically, this registry can be shown as follows:

```
token1 -> value15
token2 -> value100
...
```

As you might guess, when DI resolves a dependency, it takes tokens from the constructor parameters of a particular class and looks for their values in the DI registry. If all the required tokens are found in the registry, their values are passed to the constructor, successfully resolving the dependency of that class.

DI creates values in the registry for each token using what are called **providers**. So, in order for DI to resolve a certain dependency, the corresponding provider must first be passed to the DI registry, and then DI will issue the value of that provider by its token. Therefore, if you specified a certain dependency in a class, but did not pass the corresponding provider, DI will not be able to resolve that dependency. The [next section][100] discusses how providers can be passed to DI. A provider can be either a class or an object:

```ts {3-7}
import { Class } from '@ditsmod/core';

type Provider = Class<any> |
{ token: any, useClass: Class<any>, multi?: boolean } |
{ token: any, useValue: any, multi?: boolean } |
{ token?: any, useFactory: [Class<any>, Class<any>.prototype.methodName], multi?: boolean } |
{ token: any, useToken: any, multi?: boolean }
```

Note that the token for the provider with the `useFactory` property is optional, since DI can use the method of the specified class as a token.


If the provider is represented as an object, the following values can be passed to its properties:

- `useClass` - the class whose instance will be used as the value of this provider is passed here. An example of such a provider:

  ```ts
  { token: 'token1', useClass: SomeService }
  ```
- `useValue` - any value other than `undefined` is passed here, DI will output it unchanged. An example of such a provider:

  ```ts
  { token: 'token2', useValue: 'some value' }
  ```
- `useFactory` - a [tuple][11] is passed here, where the first place should be a class, and the second place should be a method of that class that returns some value for the given token. For example, if the class is like this:

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
  { token: 'token3', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] }
  ```

  First, DI will create an instance of this class, then call its method and get the result, which will be associated with the specified token. A method of the specified class can return any value except `undefined`.

- `useToken` - another token is passed to this provider property. If you write the following:

  ```ts
  { token: SecondService, useToken: FirstService }
  ```

  this is how you tell DI: "When consumers of providers request the `SecondService` token, the value for the `FirstService` token should be used". In other words, this directive makes an alias `SecondService` that points to `FirstService`.

Now that you are familiar with the concept of **provider**, you can clarify that **dependency** means dependency on **provider value**. Consumers of provider values have such a dependency either in service constructors, in controller constructors or methods, or in the `get()` method of [injectors][102] (more on this later).

## Injector

The so-called **DI registry** has been mentioned above. Now that you know what DI uses this registry for, it's time to learn that these registries are in injectors, and there can be many such injectors in a Ditsmod application. But first, let's understand how injectors work.

If we greatly simplify the scheme of operation of DI, we can say that DI accepts an array of providers at the input, and at the output it issues an injector that is able to create values for each passed provider. It has approximately the following picture:

```ts {16}
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

The `Injector.resolveAndCreate()` method accepts an array of providers as input, and outputs a certain object, which is exactly what is called an **injector**. This injector obviously knows how to output the value of each provider by its token using the `injector.get()` method, taking into account the entire chain of dependencies (`Service3` -> `Service2` -> `Service1`).

What the `injector.get()` does:

- when `Service3` is requested, injector looks at the constructor of this class, sees the dependency on `Service2`;
- then looks at the constructor in `Service2`, sees the dependency on `Service1`;
- then looks at the constructor in `Service1`, does not find dependencies there, and therefore first creates an instance of `Service1`;
- then creates the `Service2` instance using the `Service1` instance;
- and lastly creates the `Service3` instance using the `Service2` instance;
- if the `Service3` instance is requested again later, the `injector.get()` method will return the previously created `Service3` instance from the cache of this injector.

Sometimes the last point (when the `Service3` instance is returned from the injector cache) is undesirable. In this case, you can use the `injector.resolveAndInstantiate()` method. In fact, it does everything that `injector.get()` does, but returns a new instance each time.

When automatically resolving a class dependency (when the injector is not used directly), Ditsmod uses the `injector.get()` method under the hood.

Using DI, you may not know the entire `Service3` dependency chain, entrust this work to the injector, the main thing is to transfer all necessary classes to the DI registry. Keep in mind that you can write unit tests for individual classes this way.

## Hierarchy of injectors

DI also allows you to create a hierarchy of injectors - this is when there are parent and child injectors. At first glance, there is nothing interesting in such a hierarchy, because it is not clear what it is needed for, but in Ditsmod this possibility is used very often, since it allows you to make the application architecture modular. It is worth paying special attention to the study of the specifics of the hierarchy, it will save you more than one hour of time in the future, because you will know how it works and why it does not find this dependency...

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

By having a parent injector object, a child injector can refer to its parent when the child needs a provider value that it does not have.

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

As you can see, when the child injector was created, `Service1` was not passed to it, so when an instance of that class is requested, it goes to the parent. By the way, there is one non-obvious but very important point here: child injectors only request certain instances of classes from parent injectors and do not create them on their own. That is why this expression returns `true`:

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

Using these arrays, Ditsmod creates four different injectors, which are connected in a hierarchical relationship. Such a hierarchy can be simulated as follows:

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

Any controller, in addition to its own injector at the request level, also has three parent injectors: at the route, module, and application levels. These injectors are also generated based on the providers you pass in the following arrays:

- `providersPerApp`;
- `providersPerMod`;
- `providersPerRou`;
- `providersPerReq` (<-- this is the array from which the injector for the controller is formed).

That is, the controller can depend on services at any level.

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

### Current injector

You may rarely need the service or controller injector itself, but you can get it in the constructor, just like the values of any other provider:

```ts {6}
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

## Multi-providers

This type of provider exists only in the form of an object, and it differs from ordinary DI providers by the presence of the `multi: true` property. Such providers are advisable to use when there is a need to transfer several providers with the same token to DI at once, so that DI returns the same number of values for these providers in one array:

```ts
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // ['uk', 'en']
```

Basically, multi-providers allow you to create groups of providers that share a common token. This feature is particularly used to create the `HTTP_INTERCEPTORS` group, as well as to create various extension groups.

It is not allowed that both ordinary and multi-providers have the same token in one injector:

```ts {6-7}
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

const injector = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk' },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const locals = injector.get(LOCAL); // Error: Cannot mix multi providers and regular providers
```

Child injectors can only return multi-provider values from the parent injector if no providers with the same tokens were passed to them when they were created:

```ts
import { Injector } from '@ditsmod/core';

import { LOCAL } from './tokens';

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

import { LOCAL } from './tokens';

const parent = Injector.resolveAndCreate([
  { token: LOCAL, useValue: 'uk', multi: true },
  { token: LOCAL, useValue: 'en', multi: true },
]);

const child = parent.resolveAndCreateChild([
  { token: LOCAL, useValue: 'аа', multi: true }
]);

const locals = child.get(LOCAL); // ['аа']
```

### Changing multi-providers

To make it possible to change a specific multi-provider, you can do the following:

1. first pass the multi-provider to the array to form the injector and use the `useToken` property;
2. then transfer the class you want to replace;
3. and at the end of the array, pass the class that replaces the class you need.

```ts
import { Injector } from '@ditsmod/core';

import { HTTP_INTERCEPTORS } from './constants';
import { DefaultInterceptor } from './default.interceptor';
import { MyInterceptor } from './my.interceptor';

const injector = Injector.resolveAndCreate([
  { token: HTTP_INTERCEPTORS, useToken: DefaultInterceptor, multi: true },
  DefaultInterceptor,
  { token: DefaultInterceptor, useClass: MyInterceptor }
]);

const locals = injector.get(HTTP_INTERCEPTORS); // [MyInterceptor]
```

This construction makes sense, for example, if the first two points are performed somewhere in an external module to which you do not have access to edit, and the third point is already performed by the user of this module.

## Passing of providers to the DI registry

For one dependency, you need to transfer one or more providers to the DI registry. Most often, providers are passed to the DI registry via module metadata, although sometimes they are passed via controller metadata, or even directly to [injectors][102]. In the following example, `SomeService` is passed into the `providersPerMod` array:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { SomeService } from './some.service';
import { SomeController } from './some.controller';

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

import { SomeService } from './some.service';
import { SomeController } from './some.controller';

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

import { SomeService } from './some.service';
import { OtherService } from './other.service';

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

```ts {7}
import { rootModule } from '@ditsmod/core';

import { ConfigService } from './config.service';

@rootModule({
  providersPerApp: [
    ConfigService
  ],
})
export class AppModule {}
```

And in a certain module, we substitute `ConfigService` with an arbitrary value:

```ts {7}
import { featureModule } from '@ditsmod/core';

import { ConfigService } from './config.service';

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

As you can see, `Service2` depends on `Service1`, and the `skipSelf` decorator tells DI: "When creating an instance of `Service1`, skip the injector that will create an instance of `Service2` and immediately call the parent injector". When the parent injector is created, it is passed both required services, but because of `skipSelf`, it will not be able to contact the parent injector because it does not have one. Therefore, the parent injector will not be able to resolve the dependency.

And when creating a child injector, `Service1` was not passed to it, but it can turn to the parent injector for it. Therefore, the child injector will successfully resolve the `Service2` dependency.

## When DI can't find the right provider

Remember that when DI cannot find the right provider, there are only three possible reasons:

1. you did not transfer the required provider to DI in the metadata of the module or controller (well, or in the case of testing - in `Injector.resolveAndCreate()`);
2. you did not import the module where the provider you need is transferred, or this provider is not exported;
3. you are requesting a provider from the parent injector to the child injector.


[1]: https://en.wikipedia.org/wiki/Dependency_injection
[11]: https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
[12]: https://github.com/ditsmod/seed/blob/29f5325f6d8b031d571ad7db190cab0d6ed81200/tsconfig.json#L11
[13]: https://github.com/ditsmod/seed/blob/29f5325f6d8b031d571ad7db190cab0d6ed81200/package.json#L27
[14]: https://github.com/tc39/proposal-decorators

[107]: /developer-guides/exports-and-imports
[121]: /components-of-ditsmod-app/providers-collisions
[100]: #passing-of-providers-to-the-di-registry
[101]: #hierarchy-of-injectors
[102]: #injector
