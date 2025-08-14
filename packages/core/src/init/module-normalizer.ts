import {
  isClassProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isValueProvider,
  MultiProvider,
  reflector,
} from '#di';
import {
  isModuleWithParams,
  isRootModule,
  isProvider,
  isModDecor,
  isFeatureModule,
  isModuleWithInitHooks,
  isParamsWithMwp,
} from '#utils/type-guards.js';
import { ExtensionConfigBase, getExtensionProvider } from '#extension/get-extension-provider.js';
import { AnyFn, AnyObj, ModRefId, PickProps } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { RawMeta } from '#decorators/feature-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { BaseMeta } from '#types/base-meta.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { Class } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';
import { Extension } from '#extension/extension-types.js';
import { NormalizedProvider, normalizeProviders } from '#utils/ng-utils.js';
import { isExtensionConfig } from '#extension/type-guards.js';
import { ModuleWithParams, ModuleMetadata } from '#types/module-metadata.js';
import { mergeArrays } from '#utils/merge-arrays.js';
import { AllInitHooks, BaseInitRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { objectKeys } from '#utils/object-keys.js';
import {
  moduleIsUndefined,
  inResolvedCollisionTokensOnly,
  moduleDoesNotHaveDecorator,
  wrongModRefId,
  reexportFailed,
  wrongExtension,
  exportingUnknownSymbol,
  forbiddenExportNormalizedProvider,
  forbiddenExportProvidersPerApp,
  moduleShouldHaveValue,
} from '#errors';

/**
 * Normalizes and validates module metadata.
 */
export class ModuleNormalizer {
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  /**
   * Returns normalized module metadata.
   */
  normalize(modRefId: ModRefId, allInitHooks: AllInitHooks) {
    const aDecoratorMeta = this.getDecoratorMeta(modRefId) || [];
    let rawMeta = aDecoratorMeta.find((d) => isModDecor(d))?.value;
    const modName = getDebugClassName(modRefId);
    if (!modName) {
      throw wrongModRefId();
    }
    if (!rawMeta) {
      throw moduleDoesNotHaveDecorator(modName);
    }

    /**
     * Setting initial properties of metadata.
     */
    const baseMeta = new BaseMeta();
    baseMeta.name = modName;
    baseMeta.modRefId = modRefId;
    baseMeta.declaredInDir = rawMeta.declaredInDir;
    baseMeta.decorator = rawMeta.decorator;
    if (isModuleWithParams(modRefId)) {
      rawMeta = this.mergeModuleWithParams(rawMeta, modRefId, baseMeta);
    }
    aDecoratorMeta.filter(isModuleWithInitHooks).forEach((decorAndVal) => {
      baseMeta.mInitHooksAndRawMeta.set(decorAndVal.decorator, decorAndVal.value);
    });
    this.checkAndMarkExternalModule(rawMeta, baseMeta);
    this.normalizeImports(rawMeta, baseMeta);
    this.normalizeExports(rawMeta, baseMeta);
    this.normalizeExtensions(rawMeta, baseMeta);
    this.checkReexportModules(baseMeta);
    this.normalizeDeclaredAndResolvedProviders(rawMeta, baseMeta);
    this.addInitHooksForHostDecorator(baseMeta, allInitHooks);
    this.callInitHooksFromCurrentModule(baseMeta);
    this.addInitHooksForImportedMwp(baseMeta, allInitHooks);
    this.quickCheckMetadata(rawMeta, baseMeta);
    return baseMeta;
  }

  protected getDecoratorMeta(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const mod = isModuleWithParams(modRefId) ? modRefId.module : modRefId;
    return reflector.getDecorators(mod);
  }

  protected mergeModuleWithParams(rawMeta: RawMeta, modWitParams: ModuleWithParams, baseMeta: BaseMeta) {
    if (modWitParams.id) {
      baseMeta.id = modWitParams.id;
    }
    (['exports', 'providersPerApp', 'providersPerMod'] as const).forEach((prop) => {
      if (modWitParams[prop] instanceof Providers || modWitParams[prop]?.length) {
        rawMeta[prop] = mergeArrays(rawMeta[prop], modWitParams[prop]);
      }
    });
    if (modWitParams.extensionsMeta) {
      rawMeta.extensionsMeta = { ...rawMeta.extensionsMeta, ...modWitParams.extensionsMeta };
    }
    return rawMeta;
  }

  /**
   * For this method to work properly, the root module must be scanned first.
   */
  protected checkAndMarkExternalModule(rawMeta: RawMeta, baseMeta: BaseMeta) {
    baseMeta.isExternal = false;
    if (isRootModule(rawMeta)) {
      this.rootDeclaredInDir = baseMeta.declaredInDir;
    } else if (this.rootDeclaredInDir) {
      const { declaredInDir } = baseMeta;
      if (this.rootDeclaredInDir !== '.' && declaredInDir !== '.') {
        // Case when CallsiteUtils.getCallerDir() works correctly.
        baseMeta.isExternal = !declaredInDir.startsWith(this.rootDeclaredInDir);
      }
    }
  }

  protected normalizeImports(rawMeta: RawMeta, baseMeta: BaseMeta) {
    this.resolveForwardRef(rawMeta.imports).forEach((imp, i) => {
      this.throwIfUndefined(baseMeta.name, 'Imports', imp, i);
      if (isModuleWithParams(imp)) {
        baseMeta.importsWithParams.push(imp);
      } else {
        baseMeta.importsModules.push(imp);
      }
    });
  }

  protected normalizeDeclaredAndResolvedProviders(
    rawMeta: BaseInitRawMeta & PickProps<RawMeta, 'resolvedCollisionsPerApp'>,
    baseMeta: BaseMeta,
  ) {
    (['App', 'Mod'] as const).forEach((level) => {
      if (rawMeta[`providersPer${level}`]) {
        const providersPerLevel = this.resolveForwardRef([...rawMeta[`providersPer${level}`]!]);
        baseMeta[`providersPer${level}`].push(...providersPerLevel);
      }

      if (rawMeta[`resolvedCollisionsPer${level}`]) {
        baseMeta[`resolvedCollisionsPer${level}`].push(...rawMeta[`resolvedCollisionsPer${level}`]!);
        baseMeta[`resolvedCollisionsPer${level}`] = baseMeta[`resolvedCollisionsPer${level}`].map(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isModuleWithParams(module)) {
            module.module = resolveForwardRef(module.module);
          }
          return [token, module];
        });
      }
    });
  }

  protected throwIfResolvingNormalizedProvider(
    moduleName: string,
    rawMeta: BaseInitRawMeta & PickProps<RawMeta, 'resolvedCollisionsPerApp'>,
  ) {
    const resolvedCollisionsPerLevel: [any, ModRefId][] = [];
    if (Array.isArray(rawMeta.resolvedCollisionsPerApp)) {
      resolvedCollisionsPerLevel.push(...rawMeta.resolvedCollisionsPerApp);
    }
    if (Array.isArray(rawMeta.resolvedCollisionsPerMod)) {
      resolvedCollisionsPerLevel.push(...rawMeta.resolvedCollisionsPerMod);
    }

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        throw inResolvedCollisionTokensOnly(moduleName, providerName);
      }
    });
  }

  protected normalizeExtensions(
    rawMeta: PickProps<ModuleMetadata, 'extensions' | 'extensionsMeta'>,
    baseMeta: BaseMeta,
  ) {
    if (rawMeta.extensionsMeta) {
      baseMeta.extensionsMeta = { ...rawMeta.extensionsMeta };
    }

    rawMeta.extensions?.forEach((extensionOrConfig) => {
      if (!isExtensionConfig(extensionOrConfig)) {
        extensionOrConfig = { extension: extensionOrConfig } as ExtensionConfigBase;
      }
      const extensionObj = getExtensionProvider(extensionOrConfig);
      extensionObj.providers.forEach((p) => this.checkStageMethodsForExtension(baseMeta.name, p));
      if (extensionObj.config) {
        baseMeta.aExtensionConfig.push(extensionObj.config);
      }
      if (extensionObj.exportedConfig) {
        baseMeta.aExportedExtensionConfig.push(extensionObj.exportedConfig);
      }
      baseMeta.extensionsProviders.push(...extensionObj.providers);
      baseMeta.exportedExtensionsProviders.push(...extensionObj.exportedProviders);
    });
  }

  protected throwIfUndefined(moduleName: string, action: 'Imports' | 'Exports', imp: unknown, i: number) {
    if (imp === undefined) {
      throw moduleIsUndefined(action, moduleName, i);
    }
  }

  protected normalizeExports(rawMeta: Partial<RawMeta>, baseMeta: BaseMeta) {
    const providers: Provider[] = [];
    if (Array.isArray(rawMeta.providersPerMod)) {
      providers.push(...rawMeta.providersPerMod);
    }

    this.resolveForwardRef(rawMeta.exports).forEach((exp, i) => {
      this.throwIfUndefined(baseMeta.name, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(baseMeta.name, exp);
      if (isModuleWithParams(exp)) {
        baseMeta.exportsWithParams.push(exp);
      } else if (isProvider(exp) || getTokens(providers).includes(exp)) {
        // Provider or token of provider
        this.exportProviders(exp, rawMeta, baseMeta);
      } else if (this.getDecoratorMeta(exp)) {
        baseMeta.exportsModules.push(exp);
      } else {
        throw exportingUnknownSymbol(baseMeta.name, exp.name || exp);
      }
    });
  }

  protected checkReexportModules(baseMeta: BaseMeta) {
    const imports = [...baseMeta.importsModules, ...baseMeta.importsWithParams];
    const exports = [...baseMeta.exportsModules, ...baseMeta.exportsWithParams];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        throw reexportFailed(baseMeta.name, getDebugClassName(modRefId) || '""');
      }
    });
  }

  protected checkStageMethodsForExtension(moduleName: string, extensionsProvider: Provider) {
    const np = normalizeProviders([extensionsProvider])[0];
    let extensionClass: Class<Extension> | undefined;
    if (isClassProvider(np)) {
      extensionClass = np.useClass;
    } else if (isTokenProvider(np) && np.useToken instanceof Class) {
      extensionClass = np.useToken;
    } else if (isValueProvider(np) && np.useValue.constructor instanceof Class) {
      extensionClass = np.useValue.constructor;
    }

    if (
      !extensionClass ||
      (typeof extensionClass.prototype?.stage1 != 'function' &&
        typeof extensionClass.prototype?.stage2 != 'function' &&
        typeof extensionClass.prototype?.stage3 != 'function')
    ) {
      const token = getToken(extensionsProvider);
      throw wrongExtension(moduleName, token.name || token);
    }
  }

  protected resolveForwardRef<T extends ModRefId | Provider | { mwp: ModuleWithParams }>(arr = [] as T[]) {
    return arr.map((item) => {
      item = resolveForwardRef(item);
      if (isParamsWithMwp(item)) {
        item.mwp.module = resolveForwardRef(item.mwp.module);
      } else if (isNormalizedProvider(item)) {
        item.token = resolveForwardRef(item.token);
        if (isClassProvider(item)) {
          item.useClass = resolveForwardRef(item.useClass);
        } else if (isTokenProvider(item)) {
          item.useToken = resolveForwardRef(item.useToken);
        }
      } else if (isModuleWithParams(item)) {
        item.module = resolveForwardRef(item.module);
      }
      return item;
    });
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

  protected mergeInitParams(baseMeta: BaseMeta, decorator: AnyFn, params: AnyObj, mwp: ModuleWithParams) {
    delete params.module;
    delete params.initParams;
    mwp.initParams ??= new Map();
    if (mwp.initParams.has(decorator)) {
      const existingParams = mwp.initParams?.get(decorator)!;
      mwp.initParams.set(decorator, this.mergeObjects(params, existingParams));
    } else {
      mwp.initParams.set(decorator, params);
    }
    if (!baseMeta.importsWithParams.includes(mwp)) {
      baseMeta.importsWithParams.push(mwp);
    }
  }

  protected throwExportsIfNormalizedProvider(moduleName: string, provider: NormalizedProvider) {
    if (isNormalizedProvider(provider)) {
      throw forbiddenExportNormalizedProvider(moduleName, provider.token.name || provider.token);
    }
  }

  protected exportProviders(token: any, rawMeta: Partial<RawMeta>, baseMeta: BaseMeta): void {
    let providers = [...(rawMeta.providersPerMod || [])].filter((p) => getToken(p) === token);
    providers = this.resolveForwardRef(providers);
    if (providers.length) {
      if (providers.some(isMultiProvider)) {
        baseMeta.exportedMultiProvidersPerMod.push(...(providers as MultiProvider[]));
      } else {
        baseMeta.exportedProvidersPerMod.push(...providers);
      }
      return;
    }

    const providerName = token.name || token;
    const providersPerApp = [...(rawMeta.providersPerApp || [])];
    if (providersPerApp.some((p) => getToken(p) === token)) {
      throw forbiddenExportProvidersPerApp(baseMeta.name, providerName);
    } else {
      throw exportingUnknownSymbol(baseMeta.name, providerName);
    }
  }

  /**
   * If the instance with init hooks has `hostRawMeta`, this method
   * inserts a hook that can add `hostRawMeta` to the host module.
   */
  protected addInitHooksForHostDecorator(baseMeta: BaseMeta, allInitHooks: AllInitHooks) {
    allInitHooks.forEach((initHooks, decorator) => {
      if (initHooks.hostModule === baseMeta.modRefId && initHooks.hostRawMeta) {
        const newInitHooksAndRawMeta = initHooks.clone(initHooks.hostRawMeta);
        baseMeta.mInitHooksAndRawMeta.set(decorator, newInitHooksAndRawMeta);
      }
    });
  }

  protected callInitHooksFromCurrentModule(baseMeta: BaseMeta) {
    baseMeta.mInitHooksAndRawMeta.forEach((initHooks, decorator) => {
      baseMeta.allInitHooks.set(decorator, initHooks);

      // Importing host module.
      if (initHooks.hostModule === baseMeta.modRefId) {
        // No need import host module in host module.
      } else if (isModuleWithParams(initHooks.hostModule)) {
        if (!baseMeta.importsWithParams.includes(initHooks.hostModule)) {
          baseMeta.importsWithParams.push(initHooks.hostModule);
        }
      } else if (initHooks.hostModule && !baseMeta.importsModules.includes(initHooks.hostModule)) {
        baseMeta.importsModules.push(initHooks.hostModule);
      }

      this.fetchInitRawMeta(baseMeta, decorator, initHooks.rawMeta);
      this.callInitHook(baseMeta, decorator, initHooks);
    });
  }

  protected fetchInitRawMeta(baseMeta: BaseMeta, decorator: AnyFn, initRawMeta: BaseInitRawMeta) {
    this.fetchImports(baseMeta, decorator, initRawMeta);
    this.fetchExports(baseMeta, initRawMeta);
    this.normalizeExtensions(initRawMeta, baseMeta);
    this.normalizeDeclaredAndResolvedProviders(initRawMeta, baseMeta);
  }

  protected fetchImports(baseMeta: BaseMeta, decorator: AnyFn, initRawMeta: BaseInitRawMeta) {
    if (initRawMeta.imports) {
      this.resolveForwardRef(initRawMeta.imports).forEach((imp) => {
        if (isModuleWithParams(imp)) {
          const params = { ...imp };
          this.mergeInitParams(baseMeta, decorator, params, imp);
        } else if (isParamsWithMwp(imp)) {
          const params = { ...imp } as { mwp?: ModuleWithParams };
          this.mergeObjects(params, imp.mwp);
          delete params.mwp;
          this.mergeInitParams(baseMeta, decorator, params, imp.mwp);
        } else {
          if (!baseMeta.importsModules.includes(imp)) {
            baseMeta.importsModules.push(imp);
          }
        }
      });
    }
  }

  protected fetchExports(baseMeta: BaseMeta, initRawMeta: BaseInitRawMeta) {
    if (initRawMeta.exports) {
      this.resolveForwardRef(initRawMeta.exports).forEach((exp) => {
        if (isModuleWithParams(exp)) {
          if (!baseMeta.exportsWithParams.includes(exp)) {
            baseMeta.exportsWithParams.push(exp);
          }
        } else if (isParamsWithMwp(exp)) {
          if (!baseMeta.exportsWithParams.includes(exp.mwp)) {
            baseMeta.exportsWithParams.push(exp.mwp);
          }
        } else if (reflector.getDecorators(exp, isFeatureModule)) {
          if (!baseMeta.exportsModules.includes(exp)) {
            baseMeta.exportsModules.push(exp);
          }
        }
      });
    }
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

\@featureModule()
class Module1 {}

\@initRest({ imports: [{ module: Module1, path: 'some-prefix' }] })
\@rootModule()
export class AppModule {}
```
   * 
   * As you can see, `Module1` is imported in the context of the `initRest` decorator,
   * but `Module1` itself does not have an annotation with `initRest`. For such cases,
   * this method adds hooks so that the import of `Module1` with parameters can be properly handled.
   */
  protected addInitHooksForImportedMwp(baseMeta: BaseMeta, allInitHooks: AllInitHooks) {
    (baseMeta.modRefId as ModuleWithParams).initParams?.forEach((params, decorator) => {
      if (!baseMeta.mInitHooksAndRawMeta.has(decorator)) {
        const initHooks = allInitHooks.get(decorator)!;
        const newInitHooksAndRawMeta = initHooks.clone();
        baseMeta.allInitHooks.set(decorator, newInitHooksAndRawMeta);
        this.callInitHook(baseMeta, decorator, newInitHooksAndRawMeta);

        // This is need for `this.quickCheckMetadata()` only.
        baseMeta.mInitHooksAndRawMeta.set(decorator, newInitHooksAndRawMeta);
      }
    });
  }

  protected callInitHook(baseMeta: BaseMeta, decorator: AnyFn, initHooks: InitHooksAndRawMeta) {
    const meta = initHooks.normalize(baseMeta);
    if (meta) {
      baseMeta.initMeta.set(decorator, meta);
    }
  }

  protected quickCheckMetadata(rawMeta: RawMeta, baseMeta: BaseMeta) {
    this.throwIfResolvingNormalizedProvider(baseMeta.name, rawMeta);
    if (
      isFeatureModule(baseMeta) &&
      !baseMeta.mInitHooksAndRawMeta.size &&
      !baseMeta.exportedProvidersPerMod.length &&
      !baseMeta.exportedMultiProvidersPerMod.length &&
      !baseMeta.exportsModules.length &&
      !baseMeta.providersPerApp.length &&
      !baseMeta.exportsWithParams.length &&
      !baseMeta.exportedExtensionsProviders.length &&
      !baseMeta.extensionsProviders.length
    ) {
      throw moduleShouldHaveValue();
    }
  }
}
