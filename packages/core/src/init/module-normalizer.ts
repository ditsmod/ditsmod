import type { BaseExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { ModuleManager } from './module-manager.js';
import type { AnyObj, Level, PickProps } from '#types/mix.js';
import type { ModRefId, StaticModule } from '#decorators/module-decorator-options.js';
import type { AnyFn, Provider, Class } from '#di/top/types-and-models.js';
import type { DynamicModule, FeatureModuleOptions } from '#decorators/module-decorator-options.js';
import type { ForwardRefFn } from '#di/forward-ref.js';
import type { Extension } from '#extension/extension-types.js';
import type { AllInitHooks, InitDecoratorOptions, InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { isProvider } from '#utils/type-guards.js';
import { normalizeExtensionConfig } from '#extension/extension-providers-and-configs.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { NormalizedModuleMeta } from '#init/normalized-meta.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { ProviderBuilder } from '#utils/providers.js';
import { normalizeProviders, stringify } from '#utils/ng-utils.js';
import { isExtensionConfig } from '#extension/type-guards.js';
import { objectKeys } from '#utils/object-keys.js';
import { Reflector } from '#di/reflector.js';
import {
  isClassProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isValueProvider,
  type MultiProvider,
} from '#di/utils.js';
import {
  isDynamicModule,
  isRootModule,
  isModuleDecorator,
  isFeatureModule,
  isModuleWithInitHooks,
  isDynamicModuleWrapper,
} from '#decorators/type-guards.js';
import {
  UndefinedSymbol,
  ResolvedCollisionTokensOnly,
  MissingModuleDecorator,
  InvalidModRefId,
  ReexportFailure,
  InvalidExtension,
  UnknownExport,
  ForbiddenNormalizedExport,
  ForbiddenAppExport,
  EmptyModuleMeta,
} from '#errors';
import type { RootModuleOptions } from '#decorators/root-module.js';

/**
 * Normalizes and validates module metadata.
 */
export class ModuleNormalizer {
  protected normalizedModuleMeta: NormalizedModuleMeta;
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  /**
   * Returns normalized module metadata.
   */
  normalize(modRefId: ModRefId, allInitHooks: AllInitHooks) {
    const normalizedModuleMeta = this.initNormalizedModuleMeta(modRefId);
    const { moduleOptions } = normalizedModuleMeta;
    this.checkAndMarkExternalModule(moduleOptions);

    // Phase 1: Normalize base decorator metadata.
    this.normalizeDeclaredAndResolvedProviders(moduleOptions);
    this.normalizeExports(moduleOptions, 'Exports');
    this.mergeDynamicModule(modRefId);
    this.normalizeImports(moduleOptions);
    this.normalizeExtensions(moduleOptions);
    this.checkReexportModules();

    // Phase 2: Execute init hooks for the current module's init decorators.
    this.addInitHooksForHostDecorator(allInitHooks);
    this.callInitHooksFromCurrentModule();

    // Phase 3: Handle init hooks for imported dynamic modules lacking their own init decorators.
    this.addInitHooksForImportedDynamicModule(allInitHooks);

    this.quickCheckMeta(moduleOptions);
    return normalizedModuleMeta;
  }

  protected initNormalizedModuleMeta(modRefId: ModRefId) {
    const decoratorsMeta = this.getDecoratorMeta(modRefId) || [];
    const decoratorMeta = decoratorsMeta.find((d) => isModuleDecorator(d));
    const moduleOptions = decoratorMeta?.value;
    const moduleName = getDebugClassName(modRefId);
    if (!moduleName) {
      throw new InvalidModRefId();
    }
    if (!moduleOptions) {
      throw new MissingModuleDecorator(moduleName);
    }

    /**
     * Setting initial properties of metadata.
     */
    const normalizedModuleMeta = new NormalizedModuleMeta();
    this.normalizedModuleMeta = normalizedModuleMeta;
    normalizedModuleMeta.name = moduleName;
    normalizedModuleMeta.moduleOptions = moduleOptions;
    normalizedModuleMeta.declaredInDir = decoratorMeta?.declaredInDir || '.';
    normalizedModuleMeta.modRefId = modRefId;
    decoratorsMeta.filter(isModuleWithInitHooks).forEach(({ decoratorId, value }) => {
      normalizedModuleMeta.initHooksMap.set(decoratorId, value);
    });
    return normalizedModuleMeta;
  }

  protected getDecoratorMeta(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const staticModule = isDynamicModule(modRefId) ? resolveForwardRef(modRefId.module) : modRefId;
    return Reflector.getClassLevelMeta(staticModule);
  }

  /**
   * Since this method relies on the established variable {@link rootDeclaredInDir},
   * during scanning the {@link ModuleManager} must first scan the root module.
   */
  protected checkAndMarkExternalModule(moduleOptions: RootModuleOptions) {
    if (isRootModule(moduleOptions)) {
      this.rootDeclaredInDir = this.normalizedModuleMeta.declaredInDir;
    } else if (this.rootDeclaredInDir) {
      const { declaredInDir } = this.normalizedModuleMeta;
      if (this.rootDeclaredInDir !== '.' && declaredInDir !== '.') {
        // Case when CallsiteUtils.getCallerDir() works correctly.
        this.normalizedModuleMeta.isExternal =
          !declaredInDir.startsWith(this.rootDeclaredInDir) ||
          (!this.rootDeclaredInDir.includes('ditsmod/packages') && declaredInDir.includes('ditsmod/packages'));
      }
    }

    if (moduleOptions.inheritsContext !== undefined) {
      this.normalizedModuleMeta.inheritsContext = moduleOptions.inheritsContext;
    }
  }

  protected normalizeDeclaredAndResolvedProviders(
    moduleOptions: InitDecoratorOptions & PickProps<RootModuleOptions, 'resolvedCollisionsPerApp'>,
  ) {
    this.normalizeDeclaredProviders(moduleOptions);
    this.normalizeResolvedCollisions(moduleOptions);
  }

  protected normalizeDeclaredProviders(moduleOptions: InitDecoratorOptions) {
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      const providersKey = `providersPer${level}` as const;
      if (moduleOptions[providersKey]) {
        const providersPerLevel = this.resolveAllForwardRefs(moduleOptions[providersKey]);
        this.normalizedModuleMeta[providersKey].push(...providersPerLevel);
      }
    });
  }

  protected normalizeResolvedCollisions(
    moduleOptions: InitDecoratorOptions & PickProps<RootModuleOptions, 'resolvedCollisionsPerApp'>,
  ) {
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      const resolvedCollisionKey = `resolvedCollisionsPer${level}` as const;
      if (moduleOptions[resolvedCollisionKey]) {
        moduleOptions[resolvedCollisionKey]!.forEach(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isDynamicModule(module)) {
            module.module = resolveForwardRef(module.module);
          }
          this.normalizedModuleMeta[resolvedCollisionKey].push([token, module]);
        });
      }
    });
  }

  protected normalizeExports(moduleOptions: { exports?: any[] }, action: 'Exports' | 'Exports with params') {
    if (!moduleOptions.exports) {
      return;
    }
    const declaredTokens = getTokens(
      this.normalizedModuleMeta.providersPerMod.concat(
        this.normalizedModuleMeta.providersPerRou,
        this.normalizedModuleMeta.providersPerReq,
      ),
    );

    this.resolveAllForwardRefs(moduleOptions.exports).forEach((exp, i) => {
      if (exp === undefined) {
        throw new UndefinedSymbol(action, this.normalizedModuleMeta.name, i);
      }
      if (isNormalizedProvider(exp)) {
        throw new ForbiddenNormalizedExport(this.normalizedModuleMeta.name, exp.token.name || exp.token);
      }
      if (isDynamicModule(exp)) {
        // @todo Review this condition later
        if (!this.normalizedModuleMeta.exportsWithOpts.includes(exp)) {
          this.normalizedModuleMeta.exportsWithOpts.push(exp);
        }
      } else if (isProvider(exp) || declaredTokens.includes(exp)) {
        // Provider or token of provider
        this.exportProviders(exp);
      } else if (this.getDecoratorMeta(exp)) {
        // @todo Review this condition later
        if (!this.normalizedModuleMeta.exportsModules.includes(exp)) {
          this.normalizedModuleMeta.exportsModules.push(exp);
        }
      } else {
        throw new UnknownExport(this.normalizedModuleMeta.name, stringify(exp));
      }
    });
  }

  protected exportProviders(token: any): void {
    let found = false;
    (['Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
      const providers = this.normalizedModuleMeta[`providersPer${level}`].filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          this.normalizedModuleMeta[`exportedMultiProvidersPer${level}`].push(...(providers as MultiProvider[]));
        } else {
          this.normalizedModuleMeta[`exportedProvidersPer${level}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      if (this.normalizedModuleMeta.providersPerApp.some((p) => getToken(p) === token)) {
        throw new ForbiddenAppExport(this.normalizedModuleMeta.name, providerName);
      } else {
        throw new UnknownExport(this.normalizedModuleMeta.name, providerName);
      }
    }
  }

  protected mergeDynamicModule(modWitParams: ModRefId) {
    if (!isDynamicModule(modWitParams)) {
      return;
    }
    if (modWitParams.id) {
      this.normalizedModuleMeta.id = modWitParams.id;
    }
    (['providersPerApp', 'providersPerMod', 'providersPerRou', 'providersPerReq'] as const).forEach((prop) => {
      if (
        modWitParams[prop] instanceof ProviderBuilder ||
        (Array.isArray(modWitParams[prop]) && modWitParams[prop].length)
      ) {
        this.normalizedModuleMeta[prop].push(...this.resolveAllForwardRefs(modWitParams[prop]));
      }
    });
    this.normalizeExports(modWitParams, 'Exports with params');
    if (modWitParams.extensionsMeta) {
      this.normalizedModuleMeta.extensionsMeta = { ...modWitParams.extensionsMeta };
    }
  }

  protected normalizeImports(moduleOptions: RootModuleOptions) {
    this.resolveAllForwardRefs(moduleOptions.imports).forEach((imp, i) => {
      if (imp === undefined) {
        throw new UndefinedSymbol('Imports', this.normalizedModuleMeta.name, i);
      }
      if (isDynamicModule(imp)) {
        this.normalizedModuleMeta.importsWithOpts.push(imp);
      } else {
        this.normalizedModuleMeta.importsModules.push(imp);
      }
    });
  }

  protected throwIfResolvingNormalizedProvider(
    moduleOptions: InitDecoratorOptions & PickProps<RootModuleOptions, 'resolvedCollisionsPerApp'>,
  ) {
    const resolvedCollisionsPerLevel: [any, ModRefId | ForwardRefFn<StaticModule>][] = [];
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      if (Array.isArray(moduleOptions[`resolvedCollisionsPer${level}`])) {
        resolvedCollisionsPerLevel.push(...moduleOptions[`resolvedCollisionsPer${level}`]!);
      }
    });

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      provider = resolveForwardRef(provider);
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        throw new ResolvedCollisionTokensOnly(this.normalizedModuleMeta.name, providerName);
      }
    });
  }

  protected normalizeExtensions(moduleOptions: PickProps<FeatureModuleOptions, 'extensions' | 'extensionsMeta'>) {
    if (moduleOptions.extensionsMeta) {
      this.normalizedModuleMeta.extensionsMeta = {
        ...moduleOptions.extensionsMeta,
        ...this.normalizedModuleMeta.extensionsMeta,
      };
    }

    moduleOptions.extensions?.forEach((extensionOrConfig) => {
      if (!isExtensionConfig(extensionOrConfig)) {
        extensionOrConfig = { extension: extensionOrConfig } as BaseExtensionConfig;
      }
      const extProvidersAndConfigs = normalizeExtensionConfig(extensionOrConfig);
      extProvidersAndConfigs.providers.forEach((p) =>
        this.checkStageMethodsForExtension(this.normalizedModuleMeta.name, p),
      );
      if (extProvidersAndConfigs.config) {
        this.normalizedModuleMeta.extensionConfigs.push(extProvidersAndConfigs.config);
      }
      if (extProvidersAndConfigs.exportedConfig) {
        this.normalizedModuleMeta.exportedExtensionConfigs.push(extProvidersAndConfigs.exportedConfig);
      }
      this.normalizedModuleMeta.extensionProviders.push(...extProvidersAndConfigs.providers);
      this.normalizedModuleMeta.exportedExtensionProviders.push(...extProvidersAndConfigs.exportedProviders);
      extProvidersAndConfigs.groupTokenMap?.forEach((groupToken, ext) => {
        if (!this.normalizedModuleMeta.extensionGroupTokenMap.has(ext)) {
          this.normalizedModuleMeta.extensionGroupTokenMap.set(ext, groupToken);
          this.normalizedModuleMeta.extensionProviders.unshift({ token: groupToken, useToken: ext, multi: true });
        }
      });
      extProvidersAndConfigs.exportedGroupTokenMap?.forEach((groupToken, ext) => {
        this.normalizedModuleMeta.exportedExtensionGroupTokenMap.set(ext, groupToken);
      });
    });
  }

  protected checkStageMethodsForExtension(moduleName: string, extensionsProvider: Provider) {
    const np = normalizeProviders([extensionsProvider])[0];
    let extensionClass: Class<Extension> | undefined;
    if (isClassProvider(np)) {
      extensionClass = resolveForwardRef(np.useClass);
    } else if (isTokenProvider(np) && np.useToken instanceof Function) {
      extensionClass = np.useToken;
    } else if (isValueProvider(np) && np.useValue.constructor instanceof Function) {
      extensionClass = np.useValue.constructor;
    }

    if (
      !extensionClass ||
      (typeof extensionClass.prototype?.stage1 != 'function' &&
        typeof extensionClass.prototype?.stage2 != 'function' &&
        typeof extensionClass.prototype?.stage3 != 'function')
    ) {
      const token = getToken(extensionsProvider);
      throw new InvalidExtension(moduleName, token.name || token);
    }
  }

  protected checkReexportModules() {
    const imports = [...this.normalizedModuleMeta.importsModules, ...this.normalizedModuleMeta.importsWithOpts];
    const exports = [...this.normalizedModuleMeta.exportsModules, ...this.normalizedModuleMeta.exportsWithOpts];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        throw new ReexportFailure(this.normalizedModuleMeta.name, getDebugClassName(modRefId) || '""');
      }
    });
  }

  /**
   * If {@link InitHooks} has {@link InitHooks.hostDecoratorOptions | hostDecoratorOptions}, this method
   * inserts an init hook that can add `hostDecoratorOptions` to the host module.
   */
  protected addInitHooksForHostDecorator(allInitHooks: AllInitHooks) {
    allInitHooks.forEach((initHooks, decorator) => {
      if (initHooks.hostModule === this.normalizedModuleMeta.modRefId && initHooks.hostDecoratorOptions) {
        const newInitHooks = initHooks.clone(initHooks.hostDecoratorOptions);
        this.normalizedModuleMeta.initHooksMap.set(decorator, newInitHooks);
      }
    });
  }

  /**
   * Ensures the host module (if any) is added to `importsModules` for the current module,
   * unless the current module itself is the host module.
   */
  protected ensureHostModuleImported(initHooks: InitHooks): void {
    const { hostModule } = initHooks;
    if (
      hostModule &&
      hostModule !== this.normalizedModuleMeta.modRefId &&
      !this.normalizedModuleMeta.importsModules.includes(hostModule)
    ) {
      this.normalizedModuleMeta.importsModules.push(hostModule);
    }
  }

  /**
   * Registers an init hook into `allInitHooks`, ensures the host module is imported,
   * calls the init hook, and backfills `initHooksMap` (needed for `quickCheckMeta`
   * and `callInitHooksAfterScan`).
   */
  protected registerAndCallInitHook(decorator: AnyFn, initHooks: InitHooks): void {
    this.normalizedModuleMeta.allInitHooks.set(decorator, initHooks);
    this.ensureHostModuleImported(initHooks);
    this.callInitHook(decorator, initHooks);
    this.normalizedModuleMeta.initHooksMap.set(decorator, initHooks);
  }

  protected callInitHooksFromCurrentModule() {
    this.normalizedModuleMeta.initHooksMap.forEach((initHooks, decorator) => {
      this.normalizedModuleMeta.allInitHooks.set(decorator, initHooks);
      this.ensureHostModuleImported(initHooks);
      this.fetchInitDecoratorOptions(decorator, initHooks.moduleOptions);
      this.callInitHook(decorator, initHooks);
    });
  }

  /**
   * If the current module was used as dynamic module in the context of init decorators, but
   * the class of the current module is not annotated with those decorators, then retrieve
   * the corresponding init hooks (for reading dynamic options) from the `allInitHooks`.
   * 
   * ### Example
   * 
```ts
import { featureModule, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

@featureModule()
class Module1 {}

@initRest({ imports: [{ module: Module1, path: 'some-prefix' }] })
@rootModule()
export class AppModule {}
```
   * 
   * As you can see, `Module1` is imported in the context of the `initRest` decorator,
   * but `Module1` itself does not have an annotation with `initRest`. For such cases,
   * this method adds hooks so that the import of dynamic `Module1` can be properly handled.
   */
  protected addInitHooksForImportedDynamicModule(allInitHooks: AllInitHooks) {
    (this.normalizedModuleMeta.modRefId as DynamicModule).initOpts?.forEach((params, decorator) => {
      if (!this.normalizedModuleMeta.initHooksMap.has(decorator)) {
        const newInitHooks = allInitHooks.get(decorator)!.clone();
        this.registerAndCallInitHook(decorator, newInitHooks);
      }
    });
  }

  protected resolveAllForwardRefs<T extends ModRefId | Provider | ForwardRefFn | { dynamicModule: DynamicModule }>(
    arr: T[] | ProviderBuilder = [],
  ): Exclude<T, ForwardRefFn>[] {
    return [...arr].map((item) => {
      const resolved = resolveForwardRef(item);
      if (isDynamicModuleWrapper(resolved)) {
        resolved.dynamicModule.module = resolveForwardRef(resolved.dynamicModule.module);
      } else if (isNormalizedProvider(resolved)) {
        resolved.token = resolveForwardRef(resolved.token);
        if (isClassProvider(resolved)) {
          resolved.useClass = resolveForwardRef(resolved.useClass);
        } else if (isTokenProvider(resolved)) {
          resolved.useToken = resolveForwardRef(resolved.useToken);
        }
      } else if (isDynamicModule(resolved)) {
        resolved.module = resolveForwardRef(resolved.module);
      }
      return resolved;
    }) as Exclude<T, ForwardRefFn>[];
  }

  protected fetchInitDecoratorOptions(decorator: AnyFn, initDecoratorOptions: InitDecoratorOptions) {
    this.fetchInitImports(decorator, initDecoratorOptions);
    this.fetchInitExports(initDecoratorOptions);
    this.normalizeExtensions(initDecoratorOptions);
    this.normalizeDeclaredAndResolvedProviders(initDecoratorOptions);
    this.normalizeExports(initDecoratorOptions, 'Exports');
  }

  protected fetchInitImports(decorator: AnyFn, initDecoratorOptions: InitDecoratorOptions) {
    if (initDecoratorOptions.imports) {
      this.resolveAllForwardRefs(initDecoratorOptions.imports).forEach((imp) => {
        if (isDynamicModule(imp)) {
          const params = { ...imp };
          this.mergeInitDynamicOptions(decorator, params, imp);
        } else if (isDynamicModuleWrapper(imp)) {
          const params = { ...imp } as { dynamicModule?: DynamicModule };
          this.mergeObjects(params, imp.dynamicModule);
          delete params.dynamicModule;
          this.mergeInitDynamicOptions(decorator, params, imp.dynamicModule);
        } else {
          if (!this.normalizedModuleMeta.importsModules.includes(imp)) {
            this.normalizedModuleMeta.importsModules.push(imp);
          }
        }
      });
    }
  }

  protected mergeInitDynamicOptions(decorator: AnyFn, params: AnyObj, dynamicModule: DynamicModule) {
    delete params.module;
    delete params.initOpts;
    dynamicModule.initOpts ??= new Map();
    if (dynamicModule.initOpts.has(decorator)) {
      const existingParams = dynamicModule.initOpts.get(decorator)!;
      dynamicModule.initOpts.set(decorator, this.mergeObjects(params, existingParams));
    } else {
      dynamicModule.initOpts.set(decorator, params);
    }
    if (!this.normalizedModuleMeta.importsWithOpts.includes(dynamicModule)) {
      this.normalizedModuleMeta.importsWithOpts.push(dynamicModule);
    }
  }

  protected mergeObjects(dstn: AnyObj, src: AnyObj) {
    objectKeys(src).forEach((prop) => {
      if (prop == 'initOpts' || prop == 'module') {
        // ignore
      } else if (Array.isArray(src[prop])) {
        if (src[prop].length) {
          dstn[prop] = [...src[prop], ...(dstn[prop] || [])];
        }
      } else if (src[prop] !== null && typeof src[prop] == 'object') {
        dstn[prop] ??= {};
        dstn[prop] = Object.assign(src[prop], dstn[prop]);
      } else {
        dstn[prop] ??= src[prop];
      }
    });

    return dstn;
  }

  protected fetchInitExports(initDecoratorOptions: InitDecoratorOptions) {
    if (initDecoratorOptions.exports) {
      this.resolveAllForwardRefs(initDecoratorOptions.exports).forEach((exp) => {
        if (isDynamicModule(exp)) {
          if (!this.normalizedModuleMeta.exportsWithOpts.includes(exp)) {
            this.normalizedModuleMeta.exportsWithOpts.push(exp);
          }
        } else if (isDynamicModuleWrapper(exp)) {
          if (!this.normalizedModuleMeta.exportsWithOpts.includes(exp.dynamicModule)) {
            this.normalizedModuleMeta.exportsWithOpts.push(exp.dynamicModule);
          }
        } else if (Reflector.getClassLevelMeta(exp, isFeatureModule)) {
          if (!this.normalizedModuleMeta.exportsModules.includes(exp)) {
            this.normalizedModuleMeta.exportsModules.push(exp);
          }
        }
      });
    }
  }

  protected callInitHook(decorator: AnyFn, initHooks: InitHooks) {
    const meta = initHooks.normalize(this.normalizedModuleMeta);
    if (meta) {
      this.normalizedModuleMeta.initMeta.set(decorator, meta);
    }
  }

  protected quickCheckMeta(moduleOptions: RootModuleOptions) {
    this.throwIfResolvingNormalizedProvider(moduleOptions);
  }

  propagateParentHooks(normalizedModuleMeta: NormalizedModuleMeta, allInitHooks: AllInitHooks) {
    this.normalizedModuleMeta = normalizedModuleMeta;
    this.addInitHooksFromParent(allInitHooks);
  }

  protected addInitHooksFromParent(allInitHooks: AllInitHooks) {
    const inheritsContext = this.normalizedModuleMeta.inheritsContext ?? !this.normalizedModuleMeta.isExternal;
    if (!inheritsContext || this.normalizedModuleMeta.initHooksMap.size > 0) {
      return;
    }
    allInitHooks.forEach((initHooks, decorator) => {
      const newInitHooks = initHooks.clone();
      this.registerAndCallInitHook(decorator, newInitHooks);
    });
  }

  checkEmptyMeta(normalizedModuleMeta: NormalizedModuleMeta) {
    if (
      !isRootModule(normalizedModuleMeta) &&
      !normalizedModuleMeta.initHooksMap.size &&
      !normalizedModuleMeta.exportedProvidersPerMod.length &&
      !normalizedModuleMeta.exportedMultiProvidersPerMod.length &&
      !normalizedModuleMeta.exportsModules.length &&
      !normalizedModuleMeta.providersPerApp.length &&
      !normalizedModuleMeta.exportsWithOpts.length &&
      !normalizedModuleMeta.exportedExtensionProviders.length &&
      !normalizedModuleMeta.extensionProviders.length
    ) {
      throw new EmptyModuleMeta();
    }
  }
}
