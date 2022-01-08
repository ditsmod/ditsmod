---
sidebar_position: 1
---

# Create an extension

You can see a simple example in the folder [09-one-extension][1].

## Creating an extension class

Create a class that implements the `Extension` interface:

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

For the extension to work, you can get all the necessary data either through the constructor or from another extension by calling its `init()` method:

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

As you can see, `Extension1` receives data for its work directly through the constructor. Once it has done its job, the result is stored locally and issued on repeated calls.

`Extension2` also takes into account the possibility of re-calling `init()`, so during the second call, this method will not re-initialize. In addition, `Extension2` depends on the data taken from `Extension1`, so its constructor specifies `Extension1`, and in the body `init()` asynchronously called `this.extension1.init()`.

## Extension registration

Register the extension in an existing extension group, or create a new group, even if it has a single extension. You will need to create a new DI token for the new group.

### What do you need extension groups for

Extension groups allow you to:

- Arrange the sequence of extensions that perform different types of work.
- Add new extensions to a specific group without having to change the code of other extensions.

For example, there is a group `ROUTES_EXTENSIONS`, which includes two extensions, each of which prepares data to set routes for the router. But one extension works with the `@Route()` decorator imported from `@ditsmod/core`, the other works with the `@OasRoute()` decorator imported from `@ditsmod/openapi`. These extensions are grouped together because their `init()` methods return data with the same base interface.

The Ditsmod core knows nothing about the extension imported from `@ditsmod/openapi`, but it knows that it needs to wait for all extensions from the `ROUTES_EXTENSIONS` group to complete initialization, and only then set routes for the router.

### Creating a new group token

The extension group token must be an instance of the `InjectionToken` class.

For example, to create a token for the group `MY_EXTENSIONS`, you need to do the following:

```ts
import { InjectionToken } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<edk.Extension<void>[]>('MY_EXTENSIONS');
```

As you can see, each extension group must specify that DI will return an array of extension instances: `Extension<void>[]`. This must be done, the only difference may be in the type of the data returned as a result of calling their methods `init()`:

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

Two types of arrays can be transferred to the extensions module metadata array:

```ts
type ExtensionItem1 = [
  beforeToken: InjectionToken<Extension<any>[]>,
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];

type ExtensionItem2 = [
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];
```

The first type of array is used when you need to run your extension group before another extension group:

```ts
import { Module } from '@ditsmod/core';
import { edk } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    [edk.ROUTES_EXTENSIONS, MY_EXTENSIONS, MyExtension, true]
  ],
})
export class SomeModule {}
```

That is, in the array in the first place is a group of extensions `ROUTES_EXTENSIONS`, before which you need to run the group `MY_EXTENSIONS`. In second place is the token of the extension group `MY_EXTENSIONS`, to which your extension belongs. In the third place - the extension class, and in the fourth - `true` - is an indicator of whether to export this extension from the current module.

If your extension doesn't care before which group of extensions it will work, you can use the second type of array:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    [MY_EXTENSIONS, MyExtension, true]
  ],
})
export class SomeModule {}
```

That is, everything is the same as in the first type of array, but without a group of extensions in the first place, before which your extension should start.

## Using ExtensionsManager

For simplicity, [Creating an extension class][2] contains an example where the dependence of `Extension2` on `Extension1` is specified, but it is recommended to specify the dependence on the group of extensions, and not directly on a specific extension. In this case, you do not need to know the names of all the extensions in the extension group, just know the interface of the data returned with `init()`.

`ExtensionsManager` is used to run groups of extensions, it is also useful in that it throws errors about cyclic dependencies between extensions, and shows the whole chain of extensions that led to loops.

Suppose `MyExtension` has to wait for the initialization of the `OTHER_EXTENSIONS` group to complete. To do this, you must specify the dependence on `ExtensionsManager` in the constructor, and in `init()` call `init()` of this service:

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

`ExtensionsManager` will sequentially cause the initialization of all extensions from the specified group, and the result of their work will return as an array. If extensions return arrays, they will automatically merge into a single resulting array. This behavior can be changed if the second argument in `init()` pass `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

It is important to remember that running `init()` a particular extension processes data only in the context of the current module. For example, if `MyExtension` is imported into three different modules, Ditsmod will sequentially process these three modules with three different `MyExtension` instances. This means that one extension instance will only be able to collect data from one module.

In case you need to accumulate the results of a certain extension from all modules, you need to do the following:

```ts
import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions';

@Injectable()
export class MyExtension implements edk.Extension<void | false> {
  private inited: boolean;

  constructor(private extensionsManager: edk.ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
    if (!result) {
      return false;
    }

    // Do something here.
    this.inited = true;
  }
}
```

That is, when you need `MyExtension` to receive data from the entire application, the third parameter here is to pass the class of the current extension:

```ts
const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
```

This expression will return `false` until the last time the group `OTHER_EXTENSIONS` is called. For example, if the group `OTHER_EXTENSIONS` works in three different modules, then this expression in the first two modules will return `false`, and in the third - the value that this group of extensions should return.

## Dynamic addition of providers

Each extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add providers at the level of:

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

After this extension works, any controller or service (including interceptors) can ask in their constructors the `MyProviderPerMod`, `MyProviderPerRoute` or `MyProviderPerReq`.

Of course, such a dynamic addition of providers is possible only before the start of the web server.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[2]: #creating-an-extension-class
