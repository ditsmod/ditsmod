---
sidebar_position: 20
---

# Init Decorators and Init Hooks

:::warning
If you can easily pass metadata to a module using a [module with parameters][1], then creating an init decorator is not recommended. That is, whenever you want to create an init decorator, first consider using a [module with parameters][1].
:::

Init decorators are applied to module classes to pass metadata with extended data types. Init decorators can serve three roles:

1. As a decorator for declaring a **root module**, which has an extended data type relative to the `rootModule` decorator. For example, `restRootModule` is an init decorator.
2. As a decorator for declaring a **feature module**, which has an extended data type relative to the `featureModule` decorator. For example, `restModule` is an init decorator.
3. As a decorator for extending an already declared **root module** or **feature module**. In this case, it is recommended to name the decorator with the `init*` prefix, for example `initRest`, `initTrpc`, `initGraphql`, etc. In this role, several init decorators can be applied to a single module class at once.

Since init decorators accept module metadata with an extended type, they must be able to normalize and validate this metadata. This can be achieved through **init hooks**, which are passed into transformers during the creation of class decorators. Each transformer used for an init decorator must return an instance of a class that extends `InitHooks`:

```ts {47,51}
import {
  InitHooks,
  InitDecorator,
  makeClassDecorator,
  BaseInitRawMeta,
  FeatureModuleParams,
  BaseInitMeta,
  BaseMeta,
  RootRawMetadata,
} from '@ditsmod/core';
// ...

/**
 * An object with this type will be passed directly to the init decorator.
 */
interface RawMetadata extends BaseInitRawMeta<InitParams> {
  one?: number;
  two?: number;
}

/**
 * The methods of this class will normalize and validate the module metadata.
 */
class SomeInitHooks extends InitHooks<RawMetadata> {
  // ...
}

/**
 * An object with this type will be passed in the module metadata as a so-called "module with parameters".
 */
interface InitParams extends FeatureModuleParams {
  path?: string;
  num?: number;
}

/**
 * Init hooks transform an object of type {@link RawMetadata} into an object of that type.
 */
interface InitMeta extends BaseInitMeta {
  baseMeta: BaseMeta;
  rawMeta: RootRawMetadata;
}

// Init decorator transformer
function getInitHooks(data?: RawMetadata): InitHooks<RawMetadata> {
  const metadata = Object.assign({}, data);
  const initHooks = new SomeInitHooks(metadata);
  initHooks.moduleRole = undefined;
  // OR initHooks.moduleRole = 'root';
  // OR initHooks.moduleRole = 'feature';
  return initHooks;
}

// Creating the init decorator
const initSome: InitDecorator<RawMetadata, InitParams, InitMeta> = makeClassDecorator(getInitHooks);

// Using init decorator
@initSome({ one: 1, two: 2 })
export class SomeModule {}
```

[A ready-made example of creating an init decorator][2] can be found in the Ditsmod repository tests. In addition, you can check out a more complex but also more complete example of [creating init decorators (restRootModule, restModule, and initRest)][3], which are located in the `@ditsmod/rest` module.

[1]: /basic-components/modules/#ModuleWithParams
[2]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/core/src/init/module-normalizer.spec.ts#L282-L475
[3]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/rest/src/decorators/rest-init-hooks-and-metadata.ts
