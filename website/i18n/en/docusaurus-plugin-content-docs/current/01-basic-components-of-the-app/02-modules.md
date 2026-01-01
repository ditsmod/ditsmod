---
sidebar_position: 2
---

# Modules

One of the key elements of the Ditsmod architecture is its modules. But what exactly makes a modular architecture so advantageous? — Modularity allows you to compose various autonomous elements and assemble a scalable application from them. Thanks to the autonomy of modules, large projects are easier to develop, test, deploy, and maintain. Modularity also simplifies the transition to a microservices architecture if, in the future, you decide that your Ditsmod application requires horizontal scaling.

A modular architecture makes it possible to isolate **several code files** within a single module that may have different roles but a **shared specialization**. A module can be compared to an orchestra, where there are different instruments, but all of them create a shared piece of music. On the other hand, the need to isolate different modules arises because they may have different specializations and, as a result, may interfere with one another. Continuing the analogy with people, if you place police officers and musicians, or brokers and translators, in the same office, they will most likely interfere with each other. That is why **narrow specialization** is important for a module.

Modules are the largest building blocks of an application, and their metadata can declare components such as:
- controllers that accept HTTP requests and send HTTP responses;
- services where the business logic of the application is described;
- interceptors and guards that allow you to automate the processing of HTTP requests according to typical patterns;
- decorators and extensions that allow you to add new rules and behaviors to the application;
- other classes, interfaces, helpers, data types intended for the operation of the current module.

There are two types of modules:

1. Root module.
2. Feature module. Most often, this type of module is used for publishing on npmjs.com.

## Root module {#root-module}

Other modules are attached to the root module; it is the only one for the entire application, and its class is recommended to be named `AppModule`. A TypeScript class becomes a Ditsmod root module by using one of the decorators such as `rootModule`, `restRootModule`, `trpcRootModule`, etc., depending on the architectural style you are using. For example, if you are using REST, the root module is declared as follows:

```ts
import { restRootModule } from '@ditsmod/rest';

@restRootModule()
export class AppModule {}
```

In general, an object with the following properties can be passed to the `restRootModule` decorator:

```ts
import { restRootModule } from '@ditsmod/rest';

@restRootModule({
  imports: [], // Imported modules
  appends: [], // Appending modules that have controllers
  providersPerApp: [], // Providers at the application level
  providersPerMod: [], //         ...at the module level
  providersPerRou: [], //         ...at the route level
  providersPerReq: [], //         ...at the HTTP request level
  exports: [], // Exported modules and providers from the current module
  extensions: [], // Extensions
  extensionsMeta: {}, // Data for extensions
  resolvedCollisionsPerApp: [], // Resolution of imported class collisions at the application level
  resolvedCollisionsPerMod: [], //                                   ...at the module level
  resolvedCollisionsPerRou: [], //                                   ...at the route level
  resolvedCollisionsPerReq: [], //                                   ...at the HTTP request level
  controllers: [], // List of controllers in the current module
})
export class AppModule {}
```

## Feature module {#feature-module}

A TypeScript class becomes a Ditsmod feature module thanks to one of the following decorators: `featureModule`, `restModule`, `trpcModule`, etc., depending on the architectural style you are using. For example, if you are using REST, the feature module is declared as follows:

```ts
import { restModule } from '@ditsmod/rest';

@restModule()
export class SomeModule {}
```

It is recommended that module files end with `*.module.ts` and that their class names end with `*Module`.

It can contain exactly the same metadata as root modules, except for the `resolvedCollisionsPerApp` property. In addition to being declared directly in the application, feature module can also be published on npmjs.com.

## Export, import, append

The module where you declare certain [providers][1] is called the **host module** for those providers. And when you use those providers in an external module, that external module is called the **consumer module** of those providers.

In order for a consumer module to use providers from a host module, the corresponding provider [tokens][1] must first be exported from the host module. This is done in the metadata that is passed to the decorator of the feature module or root module. For example, if you are using REST, this is done as follows:

```ts {10}
import { restModule } from '@ditsmod/rest';

import { Service1 } from './service1.js';
import { Service2 } from './service2.js';
import { Service3 } from './service3.js';

@restModule({
  providersPerApp: [Service1],
  providersPerMod: [Service2, { token: Service3, useValue: 'some value' }],
  exports: [Service3],
})
export class Module1 {}
```

In this example, taking into account the exported tokens, Ditsmod will look for exported providers in the `providersPerMod` array. It makes no sense to export the providers that are passed to `providersPerApp`, since this array will be used to form the [injector][1] at the application level. That is, the providers from the `providersPerApp` array will be available for any module, at any level, and without exporting.

Since you only need to export provider tokens from the host module, not the providers themselves, you cannot directly pass providers in the form of an object to the `exports` property.

Keep in mind that you only need to export providers from the host module that will be directly used in the consumer modules. In the example above, `Service3` can depend on `Service2`, but `Service2` does not need to be exported if it is not directly used in the consumer module. This ensures module encapsulation.

Exporting controllers does not make sense, since exporting only applies to providers.

### Exporting providers from a feature module {#exporting-providers-from-a-featuremodule}

By exporting tokens from a host module, you are declaring that the corresponding providers can be used in consumer modules if they import this host module.

### Exporting providers from root module {#exporting-providers-from-rootmodule}

Exporting providers from the root module means that these providers will automatically be added to every module in the application. For example, if you are using REST, this is done as follows:

```ts {9}
import { restRootModule } from '@ditsmod/rest';

import { Service1 } from './service1.js';
import { Module1 } from './module1.js';

@restRootModule({
  imports: [Module1],
  providersPerMod: [Service1],
  exports: [Service1, Module1],
})
export class AppModule {}
```

In this case, `Service1` will be added to all application modules at the module level. As you can see, you can also export entire modules. In this case, all providers exported from `Module1` will also be added to each application module.

### Import module {#import-module}

You cannot import a single provider into a module, but you can import an entire module with all the providers and [extensions][2] exported from it. For example, if you are using REST, this is done as follows:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { Module1 } from './module1.js';

@restModule({
  imports: [
    Module1
  ]
})
export class Module2 {}
```

For example, if `Service1` is exported from the `Module1`, then this service can now be used in the `Module2`. However, if `Module1` has controllers, they will be ignored in this import form. For Ditsmod to take into account controllers from an imported module, the module must be imported with a prefix passed in `path`:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { Module1 } from './module1.js';

@restModule({
  imports: [
    { module: Module1, path: '' }
  ]
})
export class Module2 {}
```

Although `path` is an empty string here, for Ditsmod, the presence of `path` means:

1. to consider controllers from the imported module as well;
2. to use `path` as a prefix for all controllers imported from `Module1`.

As you can see, in the previous example, this time neither the provider nor the module is imported, but the object. This object has the following interface:

#### ModuleWithParams {#ModuleWithParams}

```ts
interface ModuleWithParams {
  id?: string;
  module: ModuleType<M>;
  /**
   * Providers per the application.
   */
  providersPerApp?: Providers | Provider[] = [];
  /**
   * Providers per a module.
   */
  providersPerMod?: Providers | Provider[] = [];
  /**
   * Providers per a route.
   */
  providersPerRou?: Providers | Provider[] = [];
  /**
   * Providers per a request.
   */
  providersPerReq?: Providers | Provider[] = [];
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
}
```

To reduce the length of the code when importing an object of this type, it is sometimes advisable to write a static method in the importing module. To see this clearly, let's take the previous example again:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { Module1 } from './module1.js';

@restModule({
  imports: [
    { module: Module1, path: '' }
  ]
})
export class Module2 {}
```

If you declare `Module1` and knew that this module would make sense to be imported many times into different modules with different prefixes, then in this case you could write a static method in this class that returns an object specially designed for import:

```ts
// ...
export class Module1 {
  static withPrefix(path: string) {
    return {
      module: this,
      path,
    };
  }
}
```

Now the object returned by this method can be imported as follows:

```ts {4}
// ...
@restModule({
  imports: [
    Module1.withPrefix('some-prefix')
  ]
})
export class Module2 {}
```

Static methods make it easier to pass module parameters.

In order for TypeScript to control exactly what the static import method returns, it is recommended to use the `ModuleWithParams` interface:

```ts
import { ModuleWithParams } from '@ditsmod/core';
// ...
export class Module1 {
  static withParams(someParams: SomeParams): ModuleWithParams<Module1> {
    return {
      module: this,
      // ...
    }
  }
}
```

#### Import classes or class instances? {#import-classes-or-class-instances}

Let's consider a specific situation. In the following example, each provider is a class. Note what arrays these providers are passed to and what exactly is exported.

```ts
// ...
@restModule({
  providersPerMod: [Provider1],
  exports: [Provider1],
})
export class Module1 {}
```

Suppose we import this module into `Module2`, which has no providers of its own:

```ts
// ...
@restModule({
  imports: [Module1]
  // ...
})
export class Module2 {}
```

As a result of this import, the consumer module (`Module2`) will now have `Provider1` at the module level, because it is declared at that level in the host module (`Module1`). When working with `Provider1`, its instances will be created separately in both modules. [Singleton][3] can be shared between modules only if its provider is declared at the application level. In our example, the provider is declared at the module level, so `Module1` and `Module2` will not have instances of `Provider1` shared at either level.

So it can be argued that classes are imported, not their instances.

#### Import and encapsulation {#import-and-encapsulation}

Let's consider a situation where only `Provider3` is exported from `Module1`, since only this provider is directly used in external modules:

```ts
// ...
@restModule({
  providersPerMod: [Provider3, Provider2, Provider1],
  exports: [Provider3],
})
export class Module1 {}
```

Suppose `Provider3` has a dependency on `Provider1` and `Provider2`. What will Ditsmod do when importing this module into other modules? Ditsmod will import all three providers, since `Provider3` depends on the other two providers.

### Appending of the module {#appending-of-the-module}

If you don't need to import providers and [extensions][2] into the current module, but just append the external module to the path prefix of the current module, you can use the `appends` array:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { Module1 } from './module1.js';

@restModule({
  appends: [Module1]
})
export class Module2 {}
```

In this case, if `Module2` has a path prefix, it will be used as a prefix for all routes contained in `Module1`. Only those modules with controllers can be appended.

You can also attach an additional path prefix to `Module1`:

```ts {3}
// ...
@restModule({
  appends: [{ path: 'some-path', module: Module1 }]
})
export class Module2 {}
```

In this example, an object was used, in which the module is passed for appending, it has the following interface:

```ts
interface AppendsWithParams<T extends AnyObj = AnyObj> {
  id?: string;
  path: string;
  module: ModuleType<T>;
  guards?: GuardItem[];
}
```

### Re-export of the module {#re-export-of-the-module}

In addition to importing a specific module, the same module can be simultaneously exported:

```ts
import { restModule } from '@ditsmod/rest';
import { Module1 } from './module1.js';

@restModule({
  imports: [Module1],
  exports: [Module1],
})
export class Module2 {}
```

What is the meaning of this? - Now if you import `Module2` into some other module, you will actually have `Module1` imported as well.

Pay attention! If during re-export you import an object with `ModuleWithParams` interface, the same object must also be exported:

```ts
import { ModuleWithParams } from '@ditsmod/core';
import { restModule, RestModuleParams } from '@ditsmod/rest';

import { Module1 } from './module1.js';

const firstModuleWithParams: ModuleWithParams & RestModuleParams = { path: 'some-path', module: Module1 };

@restModule({
  imports: [firstModuleWithParams],
  exports: [firstModuleWithParams],
})
export class Module2 {}
```


[1]: /basic-components-of-the-app/dependency-injection#injector-and-providers
[2]: /basic-components-of-the-app/extensions
[3]: https://en.wikipedia.org/wiki/Singleton_pattern
