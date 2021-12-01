---
sidebar_position: 1
---

# Create an extension

You can see a simple example in the folder [09-one-extension][1].

## Creating an extension provider

Create a provider that implements the `Extension` interface:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension<void> {
  private data: boolean;

  async init() {
    if (this.data) {
      return this.data;
    }
    // ...
    // Do something good
    // ...
    this.data = result;
    return this.data;
  }
}
```

For the extension to work, you can get all the necessary data either through the constructor or
from another extension by calling `init()`:

```ts
import { Injectable, Inject } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class Extension1 implements edk.Extension<any> {
  private data: any;

  constructor(private metadataPerMod1: edk.MetadataPerMod1) {}

  async init() {
    if (this.data) {
      return this.data;
    }
    // Do something good with `this.metadataPerMod1`.
    // ...
    this.data = result;
    return this.data;
  }
}

@Injectable()
export class Extension2 implements edk.Extension<void> {
  private inited: boolean;

  constructor(private extension1: Extension1) {}

  async init() {
    if (this.inited) {
      return;
    }

    const data = await this.extension1.init();
    // Do something here.
    this.inited = true;
  }
}
```

As you can see, `Extension1` receives data for its work directly through the constructor. Once it
has done its job, the result is stored locally and issued on repeated calls.

`Extension2` also takes into account the possibility of re-calling `init()`, so during the second
call, this method will not re-initialize. In addition, `Extension2` depends on the data taken from
`Extension1`, so its constructor specifies `Extension1`, and in the body `init()` asynchronously
called `this.extension1.init()`.

## Extension registration

Register the extension in an existing extension group, or create a new group, even if it has
a single extension. You will need to create a new DI token for the new group.

### What is a group of extensions

Groups are created in DI with the help of so-called "multi-providers". This type of providers
differs from common DI providers by the presence of the `multi: true` property. In addition, you
can send multiple providers with the same token to DI, and DI will return the same number of
instances:

```ts
[
  { provide: MY_EXTENSIONS, useClass: MyExtension1, multi: true },
  { provide: MY_EXTENSIONS, useClass: MyExtension2, multi: true },
  { provide: MY_EXTENSIONS, useClass: MyExtension3, multi: true },
];
```

Extension groups allow you to:

- launch new extensions, even if the Ditsmod core knows nothing about them;
- organize the sequence of different extensions.

For example, there is a group `ROUTES_EXTENSIONS`, which includes two extensions, each of which
prepares data to set routes for the router. But one extension works with the `@Route()` decorator
imported from `@ditsmod/core`, the other works with the `@OasRoute()` decorator imported from
`@ditsmod/openapi`. These extensions are grouped together because their `init()` methods return
data with the same base interface.

The Ditsmod core knows nothing about the extension imported from `@ditsmod/openapi`, but it knows
that it needs to wait for all extensions from the `ROUTES_EXTENSIONS` group to complete
initialization, and only then set routes for the router.

### Create a token for a new group

There are currently two types of tokens for extension groups:

1. token, which is an instance of the class `InjectionToken`;
2. a text token created on the basis of an existing token of the first type, according to the
template `BEFORE ${<InjectionToken>}`.

For example, to create the first type of tokens for the group `MY_EXTENSIONS`, you need to do the
following:

```ts
import { InjectionToken } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<edk.Extension<void>[]>('MY_EXTENSIONS');
```

As you can see, each extension group must specify that DI will return an array of extension
instances: `Extension<void>[]`. This must be done, the only difference may be in the interface of
the data returned as a result of calling their methods `init()`:

```ts
import { InjectionToken } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

interface MyInterface {
  one: string;
  two: number;
}

export const MY_EXTENSIONS = new InjectionToken<edk.Extension<MyInterface>[]>('MY_EXTENSIONS');
```

The variable `result` will now have the data type `MyInterface[]`:

```ts
const result = await this.extensionsManager.init(MY_EXTENSIONS);
```

### Extension registration

Extension multi-providers group can only be passed to the `providersPerApp` array, and no other
array, and their tokens are passed to the `extensions` array:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  providersPerApp: [{ provide: MY_EXTENSIONS, useClass: MyExtension, multi: true }],
  extensions: [MY_EXTENSIONS],
})
export class SomeModule {}
```

When you pass `MY_EXTENSIONS` to the `extensions` array, you are letting Ditsmod core know that
such a group exists and needs to be queued for initialization. And when you pass providers to the
`providersPerApp` array, you are instructing DI which extension instances will be in this group.

If you add the same extension many times, DI will create many instances of that extension. Example:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  providersPerApp: [
    { provide: MY_EXTENSIONS, useClass: MyExtension, multi: true },
    { provide: MY_EXTENSIONS, useClass: MyExtension, multi: true },
    { provide: MY_EXTENSIONS, useClass: MyExtension, multi: true },
  ],
  extensions: [MY_EXTENSIONS],
})
export class SomeModule {}
```

In this case, three separate instances of `MyExtension` will be created, no matter which tokens are
used in the `provide` property. However, this will only happen if you use `useClass` for the DI
provider.

This is an important point to understand the specifics of DI working with multi-providers, as you
may want to add your extension to a group that has a text token in the format
`BEFORE ${<InjectionToken>}`. This token template is intended for existing groups when you need
your extension to be initialized before another extension is initialized.

Registering an extension in a group with a text token type differs in three ways:

1. text token `BEFORE ${<InjectionToken>}` does not need to be passed to the `extensions` array;
2. in the multi-provider use the `useExisting` property;
3. `MyExtension` must be additionally passed directly to the array `providersPerApp`:

```ts
import { Module } from '@ditsmod/core';

import { MyExtension } from './my.extension';
import { OTHER_EXTENSIONS } from './other.extension';

@Module({
  providersPerApp: [
    MyExtension, // <-- This should only be done if you are using `BEFORE ${<InjectionToken>}`
    { provide: MY_EXTENSIONS, useExisting: MyExtension, multi: true },
    { provide: `BEFORE ${OTHER_EXTENSIONS}`, useExisting: MyExtension, multi: true },
  ],
  extensions: [MY_EXTENSIONS], // <-- The token `BEFORE ${<InjectionToken>}` is not passed here
})
export class SomeModule {}
```

In this example, the `MyExtension` will run before the `OTHER_EXTENSIONS` group is run. Using the
`useExisting` property, you instruct DI to create a single instance of `MyExtension`, even though
this extension has been passed to two different groups.

## Using ExtensionsManager

For simplicity, [Creating an extension provider][2] contains an example where the dependence of
`Extension2` on `Extension1` is specified, but it is recommended to specify the dependence on the
group of extensions, and not directly on a specific extension. In this case, you do not need to
know the names of all the extensions in the extension group, just know the interface of the data
returned with `init()`.

`ExtensionsManager` is used to run groups of extensions, it is also useful in that it throws errors
about cyclic dependencies between extensions, and shows the whole chain of extensions that led to
loops.

Suppose `MyExtension` has to wait for the initialization of the `OTHER_EXTENSIONS` group to
complete. To do this, you must specify the dependence on `ExtensionsManager` in the constructor,
and in `init()` call `init()` of this service:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions';

@Injectable()
export class MyExtension implements edk.Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(OTHER_EXTENSIONS);
    // Do something here.
    this.inited = true;
  }
}
```

`ExtensionsManager` will sequentially cause the initialization of all extensions from the specified
group, and the result of their work will return as an array. If extensions return arrays, they will
automatically merge into a single resulting array. This behavior can be changed if the second
argument in `init()` pass `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

## Dynamic addition of providers

Each extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add
providers at the level of:

- module,
- route,
- request.

For example:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const rawRoutesMeta = await this.extensionsManager.init(edk.ROUTES_EXTENSIONS);

    rawRoutesMeta.forEach((meta) => {
      // ... Create new providers and their values here, then:
      const { providersPerMod, providersPerRou, providersPerReq } = meta;
      providersPerMod.push({ provide: MyProviderPerMod, useValue: myValue1 });
      providersPerRou.push({ provide: MyProviderPerRoute, useValue: myValue1 });
      providersPerReq.push({ provide: MyProviderPerReq, useValue: myValue2 });
    });

    this.inited = true;
  }
}
```

After this extension works, any controller or service (including interceptors) can ask in their
constructors the `MyProviderPerMod`, `MyProviderPerRoute` or `MyProviderPerReq`.

Of course, such a dynamic addition of providers is possible only before the start of the web server.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[2]: #creating-an-extension-provider
