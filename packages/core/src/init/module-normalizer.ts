import type { ExtensionConfigBase } from '#extension/extension-providers-and-configs.js';
import type { ModuleManager } from './module-manager.js';
import type { AnyObj, Level, ModRefId, ModuleType, PickProps } from '#types/mix.js';
import type { AnyFn, Provider, Class } from '#di/top/types-and-models.js';
import type { DynamicModule, ModuleDecoratorOptions } from '#decorators/module-decorator-options.js';
import type { ForwardRefFn } from '#di/forward-ref.js';
import type { Extension } from '#extension/extension-types.js';
import type { AllInitHooks, InitDecoratorOptions, InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { isProvider } from '#utils/type-guards.js';
import { normalizeExtensionConfig } from '#extension/extension-providers-and-configs.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { NormalizedModuleMeta } from '#init/base-meta.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { Providers } from '#utils/providers.js';
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
  isParamsWithDynamicModule,
} from '#decorators/type-guards.js';
import {
  UndefinedSymbol,
  ResolvedCollisionTokensOnly,
  ModuleDoesNotHaveDecorator,
  InvalidModRefId,
  ReexportFailed,
  InvalidExtension,
  ExportingUnknownSymbol,
  ForbiddenExportNormalizedProvider,
  ForbiddenExportProvidersPerApp,
  ModuleShouldHaveValue,
} from '#errors';
import type { RootDecoratorOptions } from '#decorators/root-module.js';

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
    const { decoratorOptions, normalizedModuleMeta } = this.init(modRefId);
    this.checkAndMarkExternalModule(decoratorOptions);
    this.normalizeDeclaredAndResolvedProviders(decoratorOptions);
    this.normalizeExports(decoratorOptions, 'Exports');
    this.mergeModuleWithParams(modRefId);
    this.normalizeImports(decoratorOptions);
    this.normalizeExtensions(decoratorOptions);
    this.checkReexportModules();
    this.addInitHooksForHostDecorator(allInitHooks);
    this.callInitHooksFromCurrentModule();
    this.addInitHooksForImportedMwp(allInitHooks);
    this.quickCheckMetadata(decoratorOptions);
    return normalizedModuleMeta;
  }

  protected init(modRefId: ModRefId) {
    const aDecoratorMeta = this.getDecoratorMeta(modRefId) || [];
    const decorAndVal = aDecoratorMeta.find((d) => isModuleDecorator(d));
    const decoratorOptions = decorAndVal?.value;
    const modName = getDebugClassName(modRefId);
    if (!modName) {
      throw new InvalidModRefId();
    }
    if (!decoratorOptions) {
      throw new ModuleDoesNotHaveDecorator(modName);
    }

    /**
     * Setting initial properties of metadata.
     */
    const normalizedModuleMeta = new NormalizedModuleMeta();
    this.normalizedModuleMeta = normalizedModuleMeta;
    normalizedModuleMeta.name = modName;
    normalizedModuleMeta.decoratorOptions = decoratorOptions;
    normalizedModuleMeta.declaredInDir = decorAndVal?.declaredInDir || '.';
    normalizedModuleMeta.modRefId = modRefId;
    aDecoratorMeta.filter(isModuleWithInitHooks).forEach(({ decoratorId, value }) => {
      normalizedModuleMeta.mInitHooks.set(decoratorId!, value);
    });
    return { decoratorOptions, normalizedModuleMeta };
  }

  protected getDecoratorMeta(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const mod = isDynamicModule(modRefId) ? resolveForwardRef(modRefId.module) : modRefId;
    return Reflector.getClassLevelMeta(mod);
  }

  /**
   * Since this method relies on the established variable {@link rootDeclaredInDir},
   * during scanning the {@link ModuleManager} must first scan the root module.
   */
  protected checkAndMarkExternalModule(decoratorOptions: RootDecoratorOptions) {
    if (isRootModule(decoratorOptions)) {
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
  }

  protected normalizeDeclaredAndResolvedProviders(
    decoratorOptions: InitDecoratorOptions & PickProps<RootDecoratorOptions, 'resolvedCollisionPerApp'>,
  ) {
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      const providersKey = `providersPer${level}` as const;
      if (decoratorOptions[providersKey]) {
        const providersPerLevel = this.resolveAllForwardRefs(decoratorOptions[providersKey]);
        this.normalizedModuleMeta[providersKey].push(...providersPerLevel);
      }

      const resolvedCollisionKey = `resolvedCollisionPer${level}` as const;
      if (decoratorOptions[resolvedCollisionKey]) {
        decoratorOptions[resolvedCollisionKey]!.forEach(([token, module]) => {
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

  protected normalizeExports(decoratorOptions: { exports?: any[] }, action: 'Exports' | 'Exports with params') {
    if (!decoratorOptions.exports) {
      return;
    }
    const declaredTokens = getTokens(
      this.normalizedModuleMeta.providersPerMod.concat(
        this.normalizedModuleMeta.providersPerRou,
        this.normalizedModuleMeta.providersPerReq,
      ),
    );

    this.resolveAllForwardRefs(decoratorOptions.exports).forEach((exp, i) => {
      if (exp === undefined) {
        throw new UndefinedSymbol(action, this.normalizedModuleMeta.name, i);
      }
      if (isNormalizedProvider(exp)) {
        throw new ForbiddenExportNormalizedProvider(this.normalizedModuleMeta.name, exp.token.name || exp.token);
      }
      if (isDynamicModule(exp)) {
        // @todo Review this condition later
        if (!this.normalizedModuleMeta.exportsWithParams.includes(exp)) {
          this.normalizedModuleMeta.exportsWithParams.push(exp);
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
        throw new ExportingUnknownSymbol(this.normalizedModuleMeta.name, stringify(exp));
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
        throw new ForbiddenExportProvidersPerApp(this.normalizedModuleMeta.name, providerName);
      } else {
        throw new ExportingUnknownSymbol(this.normalizedModuleMeta.name, providerName);
      }
    }
  }

  protected mergeModuleWithParams(modWitParams: ModRefId) {
    if (!isDynamicModule(modWitParams)) {
      return;
    }
    if (modWitParams.id) {
      this.normalizedModuleMeta.id = modWitParams.id;
    }
    (['providersPerApp', 'providersPerMod', 'providersPerRou', 'providersPerReq'] as const).forEach((prop) => {
      if (modWitParams[prop] instanceof Providers || (Array.isArray(modWitParams[prop]) && modWitParams[prop].length)) {
        this.normalizedModuleMeta[prop].push(...this.resolveAllForwardRefs(modWitParams[prop]));
      }
    });
    this.normalizeExports(modWitParams, 'Exports with params');
    if (modWitParams.extensionsMeta) {
      this.normalizedModuleMeta.extensionsMeta = { ...modWitParams.extensionsMeta };
    }
  }

  protected normalizeImports(decoratorOptions: RootDecoratorOptions) {
    this.resolveAllForwardRefs(decoratorOptions.imports).forEach((imp, i) => {
      if (imp === undefined) {
        throw new UndefinedSymbol('Imports', this.normalizedModuleMeta.name, i);
      }
      if (isDynamicModule(imp)) {
        this.normalizedModuleMeta.importsWithParams.push(imp);
      } else {
        this.normalizedModuleMeta.importsModules.push(imp);
      }
    });
  }

  protected throwIfResolvingNormalizedProvider(
    decoratorOptions: InitDecoratorOptions & PickProps<RootDecoratorOptions, 'resolvedCollisionPerApp'>,
  ) {
    const resolvedCollisionPerLevel: [any, ModRefId | ForwardRefFn<ModuleType>][] = [];
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      if (Array.isArray(decoratorOptions[`resolvedCollisionPer${level}`])) {
        resolvedCollisionPerLevel.push(...decoratorOptions[`resolvedCollisionPer${level}`]!);
      }
    });

    resolvedCollisionPerLevel.forEach(([provider]) => {
      provider = resolveForwardRef(provider);
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        throw new ResolvedCollisionTokensOnly(this.normalizedModuleMeta.name, providerName);
      }
    });
  }

  protected normalizeExtensions(decoratorOptions: PickProps<ModuleDecoratorOptions, 'extensions' | 'extensionsMeta'>) {
    if (decoratorOptions.extensionsMeta) {
      this.normalizedModuleMeta.extensionsMeta = {
        ...decoratorOptions.extensionsMeta,
        ...this.normalizedModuleMeta.extensionsMeta,
      };
    }

    decoratorOptions.extensions?.forEach((extensionOrConfig) => {
      if (!isExtensionConfig(extensionOrConfig)) {
        extensionOrConfig = { extension: extensionOrConfig } as ExtensionConfigBase;
      }
      const extProvidersAndConfigs = normalizeExtensionConfig(extensionOrConfig);
      extProvidersAndConfigs.providers.forEach((p) =>
        this.checkStageMethodsForExtension(this.normalizedModuleMeta.name, p),
      );
      if (extProvidersAndConfigs.config) {
        this.normalizedModuleMeta.aExtensionConfig.push(extProvidersAndConfigs.config);
      }
      if (extProvidersAndConfigs.exportedConfig) {
        this.normalizedModuleMeta.aExportedExtensionConfig.push(extProvidersAndConfigs.exportedConfig);
      }
      this.normalizedModuleMeta.extensionProviders.push(...extProvidersAndConfigs.providers);
      this.normalizedModuleMeta.exportedExtensionProviders.push(...extProvidersAndConfigs.exportedProviders);
      extProvidersAndConfigs.mGroupToken?.forEach((groupToken, ext) => {
        if (!this.normalizedModuleMeta.mExtensionAsGroupToken.has(ext)) {
          this.normalizedModuleMeta.mExtensionAsGroupToken.set(ext, groupToken);
          this.normalizedModuleMeta.extensionProviders.unshift({ token: groupToken, useToken: ext, multi: true });
        }
      });
      extProvidersAndConfigs.mExportedGroupToken?.forEach((groupToken, ext) => {
        this.normalizedModuleMeta.mExportedExtensionAsGroupToken.set(ext, groupToken);
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
    const imports = [...this.normalizedModuleMeta.importsModules, ...this.normalizedModuleMeta.importsWithParams];
    const exports = [...this.normalizedModuleMeta.exportsModules, ...this.normalizedModuleMeta.exportsWithParams];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        throw new ReexportFailed(this.normalizedModuleMeta.name, getDebugClassName(modRefId) || '""');
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
        this.normalizedModuleMeta.mInitHooks.set(decorator, newInitHooks);
      }
    });
  }

  protected callInitHooksFromCurrentModule() {
    this.normalizedModuleMeta.mInitHooks.forEach((initHooks, decorator) => {
      this.normalizedModuleMeta.allInitHooks.set(decorator, initHooks);

      // Importing host module.
      if (initHooks.hostModule === this.normalizedModuleMeta.modRefId) {
        // No need import host module in host module.
      } else if (initHooks.hostModule && !this.normalizedModuleMeta.importsModules.includes(initHooks.hostModule)) {
        this.normalizedModuleMeta.importsModules.push(initHooks.hostModule);
      }

      this.fetchInitDecoratorOptions(decorator, initHooks.decoratorOptions);
      this.callInitHook(decorator, initHooks);
    });
  }

  /**
   * If the current module was used with parameters in the context of init decorators, but
   * the class of the current module is not annotated with those decorators, then retrieve
   * the corresponding init hooks (for reading parameters) from the `allInitHooks`.
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
   * this method adds hooks so that the import of `Module1` with parameters can be properly handled.
   */
  protected addInitHooksForImportedMwp(allInitHooks: AllInitHooks) {
    (this.normalizedModuleMeta.modRefId as DynamicModule).initParams?.forEach((params, decorator) => {
      if (!this.normalizedModuleMeta.mInitHooks.has(decorator)) {
        const initHooks = allInitHooks.get(decorator)!;
        const newInitHooks = initHooks.clone();
        this.normalizedModuleMeta.allInitHooks.set(decorator, newInitHooks);
        this.callInitHook(decorator, newInitHooks);

        /**
         * This is need for {@link quickCheckMetadata} only.
         */
        this.normalizedModuleMeta.mInitHooks.set(decorator, newInitHooks);
      }
    });
  }

  protected resolveAllForwardRefs<T extends ModRefId | Provider | ForwardRefFn | { dynamicModule: DynamicModule }>(
    arr: T[] | Providers = [],
  ): Exclude<T, ForwardRefFn>[] {
    return [...arr].map((item) => {
      const resolved = resolveForwardRef(item);
      if (isParamsWithDynamicModule(resolved)) {
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
          this.mergeInitParams(decorator, params, imp);
        } else if (isParamsWithDynamicModule(imp)) {
          const params = { ...imp } as { dynamicModule?: DynamicModule };
          this.mergeObjects(params, imp.dynamicModule);
          delete params.dynamicModule;
          this.mergeInitParams(decorator, params, imp.dynamicModule);
        } else {
          if (!this.normalizedModuleMeta.importsModules.includes(imp)) {
            this.normalizedModuleMeta.importsModules.push(imp);
          }
        }
      });
    }
  }

  protected mergeInitParams(decorator: AnyFn, params: AnyObj, dynamicModule: DynamicModule) {
    delete params.module;
    delete params.initParams;
    dynamicModule.initParams ??= new Map();
    if (dynamicModule.initParams.has(decorator)) {
      const existingParams = dynamicModule.initParams.get(decorator)!;
      dynamicModule.initParams.set(decorator, this.mergeObjects(params, existingParams));
    } else {
      dynamicModule.initParams.set(decorator, params);
    }
    if (!this.normalizedModuleMeta.importsWithParams.includes(dynamicModule)) {
      this.normalizedModuleMeta.importsWithParams.push(dynamicModule);
    }
  }

  protected mergeObjects(dstn: AnyObj, src: AnyObj) {
    objectKeys(src).forEach((prop) => {
      if (prop == 'initParams' || prop == 'module') {
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
          if (!this.normalizedModuleMeta.exportsWithParams.includes(exp)) {
            this.normalizedModuleMeta.exportsWithParams.push(exp);
          }
        } else if (isParamsWithDynamicModule(exp)) {
          if (!this.normalizedModuleMeta.exportsWithParams.includes(exp.dynamicModule)) {
            this.normalizedModuleMeta.exportsWithParams.push(exp.dynamicModule);
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

  protected quickCheckMetadata(decoratorOptions: RootDecoratorOptions) {
    this.throwIfResolvingNormalizedProvider(decoratorOptions);
    if (
      !isRootModule(this.normalizedModuleMeta) &&
      !this.normalizedModuleMeta.mInitHooks.size &&
      !this.normalizedModuleMeta.exportedProvidersPerMod.length &&
      !this.normalizedModuleMeta.exportedMultiProvidersPerMod.length &&
      !this.normalizedModuleMeta.exportsModules.length &&
      !this.normalizedModuleMeta.providersPerApp.length &&
      !this.normalizedModuleMeta.exportsWithParams.length &&
      !this.normalizedModuleMeta.exportedExtensionProviders.length &&
      !this.normalizedModuleMeta.extensionProviders.length
    ) {
      throw new ModuleShouldHaveValue();
    }
  }
}
