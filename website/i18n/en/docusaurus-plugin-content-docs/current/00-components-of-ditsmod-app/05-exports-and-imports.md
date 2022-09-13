---
sidebar_position: 5
---

# Export and import

## Export of the providers from non-root module

By exporting providers from a particular module, you are declaring that they are available for use in other modules that will import that module:

```ts
import { Module } from '@ditsmod/core';

import { SomeService } from './some.service';

@Module({
  providersPerMod: [SomeService],
  exports: [SomeService],
})
export class SomeModule {}
```

Note that not only is `SomeService` added to the `exports` array, this provider is also declared at the `providersPerMod` level. When exporting, the provider's _declaration_ at a certain level is required.

Providers can only export those that are declared:

1. at the module level (ie in the array `providersPerMod`);
2. or at the route level (ie in the array `providersPerRou`);
3. or at the request level (ie in the array `providersPerReq`).

It doesn't make sense to export providers declared at the application level (ie in the `providersPerApp` array), because _declaration_ them at the application level means _exporting_ them at that level.

It also does not make sense to export controllers, as exports apply only to providers.

## Export of the providers from the root module

Exporting providers from the root module means that these providers become available to any service or controller in the application, with their declaration level preserved:

```ts
import { RootModule } from '@ditsmod/core';

import { SomeService } from './some.service';
import { OtherModule } from './other.module';

@RootModule({
  imports: [OtherModule],
  providersPerMod: [SomeService],
  exports: [SomeService, OtherModule],
})
export class AppModule {}
```

As you can see, in addition to exporting individual providers declared in the root module, you can also export entire modules.

## Import of the module

You cannot import a single provider into the Ditsmod module, but you can import an entire module with all the providers exported from it:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';

@Module({
  imports: [
    FirstModule
  ]
})
export class ThridModule {}
```

For example, if `FirstModule` exports `SomeService`, then this service can now be used in `ThridModule` in any of its services or controllers.

Note that when importing, the provider's declaration level remains the same as it was when exporting. For example, if `SomeService` was declared at the module level, then the same level will remain when importing.

However, if `FirstModule` has controllers, they will be ignored in this import form. For Ditsmod to take into account the controllers from the imported module, you need to use an object with the following interface:

```ts
interface ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj> {
  id?: string;
  module: ModuleType<M>;
  path?: string;
  guards?: GuardItem[];
  providersPerApp?: ServiceProvider[];
  providersPerMod?: ServiceProvider[];
  providersPerRou?: ServiceProvider[];
  providersPerReq?: ServiceProvider[];
  extensionsMeta?: E;
}
```

Such an interface allows you to transfer, in addition to the module itself, certain arguments for the listed parameters:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    { path: '', guards: [AuthGuard], module: FirstModule }
  ]
})
export class ThridModule {}
```

Although here `path` is an empty string, for Ditsmod the presence of `path` means:

1. that the controllers from the imported module must also be taken into account;
2. to use `path` as a prefix for all controllers imported from `FirstModule`.

You should also keep in mind that the current module does not prohibit re-declaring the provider level already announced in the external module, but this is not recommended. If you need a provider from an external module, import this module completely.

And if you want to use a provider that is not exported from an external module, it is also not recommended to do so, because you will rely on a non-public API, which can change at any time without notice.

## Re-export of the module

In addition to importing a specific module, the same module can be exported at the same time:

```ts
import { Module } from '@ditsmod/core';

import { FirstModule } from './first.module';

@Module({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

What's the point of this? - Now, if you import `SecondModule` into some other module, you will actually have `FirstModule` also imported.


[121]: ./providers-collisions