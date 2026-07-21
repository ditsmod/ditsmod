---
sidebar_position: 2
---

# Init Decorators and Init Hooks

:::warning
If you can easily pass metadata to a module using a [dynamic module][1], then creating an init decorator is not recommended. That is, whenever you want to create an init decorator, first consider using a [dynamic module][1].
:::

Init decorators are applied to module classes to pass metadata with extended data types. Init decorators can serve three roles:

1. As a decorator for declaring a **root module**, which has an extended data type relative to the `rootModule` decorator. For example, `restRootModule` is an init decorator.
2. As a decorator for declaring a **feature module**, which has an extended data type relative to the `featureModule` decorator. For example, `restModule` is an init decorator.
3. As a decorator for extending an already declared **root module** or **feature module**. In this case, it is recommended to name the decorator with the `init*` prefix, for example `initRest`, `initTrpc`, `initGraphql`, etc. In this role, several init decorators can be applied to a single module class at once.

Since init decorators accept module metadata with an extended type, they must be able to normalize and validate this metadata. This can be achieved through **init hooks**, which are passed into transformers during the creation of class decorators. Each transformer used for an init decorator must return an instance of a class that extends `InitHooks`:

```ts {46,50}
import {
  InitHooks,
  InitDecorator,
  Reflector,
  InitDecoratorOptions,
  DynamicModuleOptions,
  NormalizedInitMeta,
  NormalizedModuleMeta,
  RootDecoratorOptions,
} from '@ditsmod/core';
// ...

/**
 * An object with this type will be passed directly to the init decorator - @initSome({ one: 1, two: 2 })
 */
interface ExtInitDecorOpts extends InitDecoratorOptions<InitOpts> {
  one?: number;
  two?: number;
}

/**
 * The methods of this class will normalize and validate the module metadata.
 */
class SomeInitHooks extends InitHooks<ExtInitDecorOpts> {
  // ...
}

/**
 * An object with this type will be passed in the module metadata as a so-called "DynamicModule".
 */
interface InitOpts extends DynamicModuleOptions {
  path?: string;
  num?: number;
}

/**
 * Init hooks transform an object of ExtInitDecorOpts into an object of that type.
 */
interface InitMeta extends NormalizedInitMeta {
  normalizedModuleMeta: NormalizedModuleMeta;
  initDecoratorOptions: RootDecoratorOptions;
}

function transformInitDecoratorOptions(data?: ExtInitDecorOpts): InitHooks<ExtInitDecorOpts> {
  const metadata = Object.assign({}, data);
  const initHooks = new SomeInitHooks(metadata);
  initHooks.moduleRole = undefined;
  // OR initHooks.moduleRole = 'root';
  // OR initHooks.moduleRole = 'feature';
  return initHooks;
}

// Creating the init decorator
const initSome: InitDecorator<ExtInitDecorOpts, InitOpts, InitMeta> =
  Reflector.makeClassDecorator(transformInitDecoratorOptions);

// Using init decorator
@initSome({ one: 1, two: 2 })
export class SomeModule {}
```

[A ready-made example of creating an init decorator][2] can be found in the Ditsmod repository tests. In addition, you can check out a more complex but also more complete example of [creating init decorators (restRootModule, restModule, and initRest)][3], which are located in the `@ditsmod/rest` module.

## Interaction with Root and Feature Modules {#interaction-with-root-and-feature-modules}

Depending on the role defined by the `moduleRole` property of the `InitHooks` class (which is returned by the transformer function), init decorators interact differently with standard decorators (`rootModule` and `featureModule`):

- **Substitute Decorators** (`moduleRole` is `'root'` or `'feature'`): These decorators act as complete module decorators. A class annotated with them (e.g. `@restRootModule` or `@restModule`) does not require `@featureModule` or `@rootModule`. The framework automatically recognizes their role and processes them.
- **Modifier Decorators** (`moduleRole` is `undefined`): These decorators only modify/extend metadata. A class annotated with them (e.g. `@initRest`) **must** also have a standard module decorator (or a substitute decorator). If no module decorator is present, the framework throws a `MissingModuleDecorator` exception.

Multiple modifier decorators can be stacked on a single class (for example, to add REST or tRPC metadata to the same module).

## Grouping Init-Decorators with `decoratorId` {#grouping-init-decorators}

When creating a substitute decorator (with `'root'` or `'feature'` role) using `Reflector.makeClassDecorator()`, you **must** pass the base modifier decorator (e.g. `initRest` or `initSome`) as the third argument. This third argument serves as the `decoratorId`. It tells Ditsmod that these decorators belong to the same group, enabling the framework to correctly collect, normalize, and associate metadata with the proper group context during initialization.

## Customizing InitHooks {#customizing-inithooks}

The `InitHooks` base class provides several lifecycle properties and methods you can override to control metadata processing:

### Lifecycles and Properties {#lifecycles-and-properties}

- `moduleRole?: 'root' | 'feature'`: Determines whether the decorator behaves as a substitute for `@rootModule` or `@featureModule`.
- `hostModule?: ModuleType`: The class of the module to automatically import. When the decorator is applied to any class, the specified `hostModule` is automatically added to its `imports` array (if not already present).
- `hostDecoratorOptions?: T`: Options to pass to the decorator of the host module. This allows attaching metadata to the host module class without directly decorating it, resolving potential circular dependencies.
- `normalize(normalizedModuleMeta)`: Validates and normalizes raw metadata, returning a structured metadata object that gets saved in `normalizedModuleMeta.initMeta`.
- `getModulesToScan(meta)`: Returns an array of module classes/references that should also be scanned (e.g., appended modules in REST).
- `exportAppProviders(config)`: Invoked at bootstrap to collect and export application-level providers.
- `importModulesShallow(config)`: Invoked during the shallow import step to scan routes, paths, controllers, and guards.
- `importModulesDeep(config)`: Invoked during the deep import step to resolve provider dependencies.
- `getProvidersToOverride(meta)`: Returns an array of provider arrays that can be overridden (e.g., for testing).

### Separation of Feature Module and Init-Decorator using hostModule {#separation-of-feature-module-and-init-decorator-using-hostmodule}

Separating the init-decorator's hook definitions from the host feature module is necessary to avoid circular dependencies (since the decorator imports the module, decorating the module with its own decorator would create an import loop):

1. First, create a standard feature module (e.g., `MyLibModule`) containing all necessary extensions, default providers, and services.
2. Next, define your custom `InitHooks` subclass setting `override hostModule = MyLibModule`.
3. Create the base modifier decorator `init*` (e.g. `initMy`) which serves as the ID for the decorator group.
4. Create the transformer function that returns the hooks instance and sets `hooks.moduleRole = 'feature'` (or `'root'`).
5. Create the substitute custom decorator (e.g. `myFeatureModule`) using `Reflector.makeClassDecorator()`, passing the transformer as the first argument, its name as the second, and the base modifier decorator (`initMy`) as the third argument (group ID).
6. When developers apply this decorator (e.g., `@myFeatureModule`), the framework recognizes it as a module decorator (requiring only one decorator on the class instead of two) and automatically imports `MyLibModule`.

Here is an example:

```ts
import { featureModule, InitHooks, Reflector } from '@ditsmod/core';

// 1. Standard module containing actual logic/providers
@featureModule({
  providersPerReq: [MyService],
  exports: [MyService],
})
export class MyLibModule {}

// 2. Custom hooks setting hostModule
class MyInitHooks extends InitHooks {
  override hostModule = MyLibModule;
}

// 3. Creating the base modifier decorator (serves as the group parent)
export const initMy = Reflector.makeClassDecorator((data) => new MyInitHooks(data), 'initMy');

// 4. Creating the transformer that sets moduleRole = 'feature'
function transformFeatureMeta(data?: any) {
  const hooks = new MyInitHooks(data);
  hooks.moduleRole = 'feature'; // Makes it a substitute module decorator
  return hooks;
}

// 5. Creating the substitute decorator, passing initMy as the 3rd argument
export const myFeatureModule = Reflector.makeClassDecorator(transformFeatureMeta, 'myFeatureModule', initMy);

// 6. Using only one decorator on the class (automatically imports MyLibModule)
@myFeatureModule()
export class MyFeatureModule {}
```

## Imported dynamic module options {#imported-dynamic-module-options}

When importing a dynamic module in the context of an init decorator:

1. The custom options (like `path` or `guards`) are automatically merged into `dynamicModule.initOpts` under the decorator's token key.
2. If the imported module is a plain `@featureModule` (not decorated with the init decorator), the framework retrieves the default hook class for that decorator from the application context, clones it, registers it in the module's `initHooksMap` list, and calls `normalize()`.
3. This ensures that options like route prefixes and guards are correctly processed even when importing standard feature modules that have no custom init decorator annotations.

[1]: /basic-components/modules/#DynamicModule
[2]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/core/src/init/module-normalizer.spec.ts#L333-L531
[3]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/rest/src/decorators/rest-init-hooks-and-metadata.ts
