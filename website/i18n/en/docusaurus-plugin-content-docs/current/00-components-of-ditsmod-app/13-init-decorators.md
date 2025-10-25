---
sidebar_position: 13
---

# Init Decorators and Init Hooks

Init decorators are applied to module classes to pass metadata with extended data types, compared to `rootModule` or `featureModule`. Init decorators can serve three roles:

1. As a decorator for the root module (extending the data type passed to the `rootModule` decorator).
2. As a decorator for a feature module (extending the data type passed to the `featureModule` decorator).
3. As a decorator for extending either the root module or a feature module. In this case, it is recommended to name the decorator with the `init*` prefix, for example `initRest`, `initTrpc`, `initGraphql`, etc. In this role, multiple init decorators can be applied to a single module class.

Since init decorators extend the module metadata type, they must be able to normalize and validate this metadata. This can be achieved through **init hooks**, which are passed into transformers during the creation of class decorators. Each transformer used for an init decorator must return an instance of a class that extends `InitHooks`:

```ts {12,16}
import { InitHooks, makeClassDecorator } from '@ditsmod/core';
// ...

// The methods of this class will normalize and validate the module metadata
class SomeInitHooks extends InitHooks<SomeInitRawMeta> {
  // ...
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
```

[A ready-made example of creating an init decorator][2] can be found in the Ditsmod repository tests. In addition, you can check out a more complex but also more complete example of [creating init decorators (restRootModule, restModule, and initRest)][3], which are located in the `@ditsmod/rest` module.

If you can easily pass metadata to a module using a [module with parameters][1], then creating an init decorator is not recommended. That is, whenever you want to create an init decorator, first consider using a [module with parameters][1].

[1]: /developer-guides/exports-and-imports/#ModuleWithParams
[2]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/core/src/init/module-normalizer.spec.ts#L282-L475
[3]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/rest/src/decorators/rest-init-hooks-and-metadata.ts
