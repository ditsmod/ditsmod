---
sidebar_position: 1
---

# Export, import, append

The module where you declare certain [providers][1] is called the **host module** for those providers. And when you use those providers in an external module, that external module is called the **consumer module** of those providers.

In order for a consumer module to use providers from a host module, the corresponding provider [tokens][1] must first be exported from the host module. This is done in the metadata that is passed to the `featureModule` or `rootModule` decorator:

```ts {9}
import { featureModule } from '@ditsmod/core';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';
import { ThirdService } from './third.service.js';

@featureModule({
  providersPerMod: [FirstService, { token: SecondService, useClass: ThirdService }],
  exports: [SecondService],
})
export class SomeModule {}
```

Considering the exported tokens, Ditsmod will look for exported providers in the `providersPerMod` array. It makes no sense to export the providers that are passed to `providersPerApp`, since this array will be used to form the [injector][1] at the application level. That is, the providers from the `providersPerApp` array will be available for any module, at any level, and without exporting.

Since you only need to export provider tokens from the host module, not the providers themselves, you cannot directly pass providers in the form of an object to the `exports` property.

Keep in mind that you only need to export providers from the host module that will be directly used in the consumer modules. In the example above, `SecondService` can depend on `FirstService`, but `FirstService` does not need to be exported if it is not directly used in the consumer module. This ensures module encapsulation.

Exporting controllers does not make sense, since exporting only applies to providers.

## Exporting providers from a `featureModule` {#exporting-providers-from-a-featuremodule}

By exporting tokens from a host module in the `featureModule` decorator metadata, you are declaring that the corresponding providers can be used in consumer modules if they import this host module.

## Exporting providers from `rootModule` {#exporting-providers-from-rootmodule}

Exporting providers from the root module means that these providers will automatically be added to every module in the application:

```ts {9}
import { rootModule } from '@ditsmod/core';

import { SomeService } from './some.service.js';
import { OtherModule } from './other.module.js';

@rootModule({
  imports: [OtherModule],
  providersPerMod: [SomeService],
  exports: [SomeService, OtherModule],
})
export class AppModule {}
```

In this case, `SomeService` will be added to all application modules at the module level. As you can see, you can also export entire modules. In this case, all providers exported from `OtherModule` will also be added to each application module.

## Import module {#import-module}

You cannot import a single provider into a module, but you can import an entire module with all the providers and [extensions][2] exported from it:

```ts {6}
import { featureModule } from '@ditsmod/core';
import { FirstModule } from './first.module.js';

@featureModule({
  imports: [
    FirstModule
  ]
})
export class SecondModule {}
```

For example, if `SomeService` is exported from the `FirstModule`, then this service can now be used in the `SecondModule`. However, if `FirstModule` has controllers, they will be ignored in this import form. For Ditsmod to take into account controllers from an imported module, the module must be imported with a prefix passed in `path`:

```ts {7}
import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { FirstModule } from './first.module';

@initRest({
  importsWithParams: [
    { modRefId: FirstModule, path: '' }
  ]
})
@featureModule()
export class SecondModule {}
```

Although `path` is an empty string here, for Ditsmod, the presence of `path` means:

1. to consider controllers from the imported module as well;
2. to use `path` as a prefix for all controllers imported from `FirstModule`.

As you can see, in the previous example, this time neither the provider nor the module is imported, but the object. This object has the following interface:

<a id="ModuleWithParams"></a>

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

```ts {7}
import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { FirstModule } from './first.module';

@initRest({
  importsWithParams: [
    { modRefId: FirstModule, path: '' }
  ]
})
@featureModule()
export class SecondModule {}
```

If you declare `FirstModule` and knew that this module would make sense to be imported many times into different modules with different prefixes, then in this case you could write a static method in this class that returns an object specially designed for import:

```ts
// ...
export class FirstModule {
  static withPrefix(path: string) {
    return {
      modRefId: this,
      path,
    };
  }
}
```

Now the object returned by this method can be imported as follows:

```ts {4}
// ...
@featureModule({
  importsWithParams: [
    FirstModule.withPrefix('some-prefix')
  ]
})
@featureModule()
export class SecondModule {}
```

Static methods make it easier to pass module parameters.

In order for TypeScript to control exactly what the static import method returns, it is recommended to use the `ModuleWithParams` interface:

```ts
import { ModuleWithParams } from '@ditsmod/core';
// ...
export class SomeModule {
  static withParams(someParams: SomeParams): ModuleWithParams<SomeModule> {
    return {
      module: this,
      // ...
    }
  }
}
```

### Import classes or class instances? {#import-classes-or-class-instances}

Let's consider a specific situation. In the following example, each provider is a class. Note what arrays these providers are passed to and what exactly is exported.

```ts
// ...
@featureModule({
  providersPerMod: [Provider1],
  exports: [Provider1],
})
export class Module1 {}
```

Suppose we import this module into `Module2`, which has no providers of its own:

```ts
// ...
@featureModule({
  imports: [Module1]
  // ...
})
export class Module2 {}
```

As a result of this import, the consumer module (`Module2`) will now have `Provider1` at the module level, because it is declared at that level in the host module (`Module1`). When working with `Provider1`, its instances will be created separately in both modules. [Singleton][3] can be shared between modules only if its provider is declared at the application level. In our example, the provider is declared at the module level, so `Module1` and `Module2` will not have instances of `Provider1` shared at either level.

So it can be argued that classes are imported, not their instances.

### Import and encapsulation {#import-and-encapsulation}

Let's consider a situation where only `Provider3` is exported from `Module1`, since only this provider is directly used in external modules:

```ts
// ...
@featureModule({
  providersPerMod: [Provider3, Provider2, Provider1],
  exports: [Provider3],
})
export class Module1 {}
```

Suppose `Provider3` has a dependency on `Provider1` and `Provider2`. What will Ditsmod do when importing this module into other modules? Ditsmod will import all three providers, since `Provider3` depends on the other two providers.

## Appending of the module {#appending-of-the-module}

If you don't need to import providers and [extensions][2] into the current module, but just append the external module to the path prefix of the current module, you can use the `appends` array:

```ts {5}
import { featureModule } from '@ditsmod/core';
import { FirstModule } from './first.module.js';

@featureModule({
  appends: [FirstModule]
})
export class SecondModule {}
```

In this case, if `SecondModule` has a path prefix, it will be used as a prefix for all routes contained in `FirstModule`. Only those modules with controllers can be appended.

You can also attach an additional path prefix to `FirstModule`:

```ts {3}
// ...
@featureModule({
  appends: [{ path: 'some-path', module: FirstModule }]
})
export class SecondModule {}
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

## Re-export of the module {#re-export-of-the-module}

In addition to importing a specific module, the same module can be simultaneously exported:

```ts
import { featureModule } from '@ditsmod/core';
import { FirstModule } from './first.module.js';

@featureModule({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

What is the meaning of this? - Now if you import `SecondModule` into some other module, you will actually have `FirstModule` imported as well.

Pay attention! If during re-export you import an object with `ModuleWithParams` interface, the same object must also be exported:

```ts
import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { FirstModule } from './first.module.js';

const firstModuleWithParams: ModuleWithParams = { path: 'some-path', module: FirstModule };

@featureModule({
  imports: [firstModuleWithParams],
  exports: [firstModuleWithParams],
})
export class SecondModule {}
```


[1]: /components-of-ditsmod-app/dependency-injection#injector-and-providers
[2]: /components-of-ditsmod-app/extensions
[3]: https://en.wikipedia.org/wiki/Singleton_pattern
