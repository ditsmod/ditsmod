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
import { AnyFn, AnyObj, Level, ModRefId, ModuleType, PickProps } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { RootRawMetadata } from '#decorators/module-raw-metadata.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { BaseMeta } from '#types/base-meta.js';
import { ForwardRefFn, resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { Class } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';
import { Extension } from '#extension/extension-types.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { isExtensionConfig } from '#extension/type-guards.js';
import { ModuleWithParams, ModuleRawMetadata } from '#decorators/module-raw-metadata.js';
import { AllInitHooks, BaseInitRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { objectKeys } from '#utils/object-keys.js';
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

/**
 * Normalizes and validates module metadata.
 */
export class ModuleNormalizer {
  protected baseMeta: BaseMeta;
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  /**
   * Returns normalized module metadata.
   */
  normalize(modRefId: ModRefId, allInitHooks: AllInitHooks) {
    const aDecoratorMeta = this.getDecoratorMeta(modRefId) || [];
    const rawMeta = aDecoratorMeta.find((d) => isModDecor(d))?.value;
    const modName = getDebugClassName(modRefId);
    if (!modName) {
      throw new InvalidModRefId();
    }
    if (!rawMeta) {
      throw new ModuleDoesNotHaveDecorator(modName);
    }

    /**
     * Setting initial properties of metadata.
     */
    const baseMeta = new BaseMeta();
    this.baseMeta = baseMeta;
    baseMeta.name = modName;
    baseMeta.modRefId = modRefId;
    this.checkAndMarkExternalModule(rawMeta);
    this.normalizeDeclaredAndResolvedProviders(rawMeta);
    this.normalizeExports(rawMeta, 'Exports');
    if (isModuleWithParams(modRefId)) {
      this.mergeModuleWithParams(modRefId);
    }
    aDecoratorMeta.filter(isModuleWithInitHooks).forEach((decorAndVal) => {
      baseMeta.mInitHooks.set(decorAndVal.decorator, decorAndVal.value);
    });
    this.normalizeImports(rawMeta);
    this.normalizeExtensions(rawMeta);
    this.checkReexportModules();
    this.addInitHooksForHostDecorator(allInitHooks);
    this.callInitHooksFromCurrentModule();
    this.addInitHooksForImportedMwp(allInitHooks);
    this.quickCheckMetadata(rawMeta);
    return baseMeta;
  }

  protected getDecoratorMeta(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const mod = isModuleWithParams(modRefId) ? modRefId.module : modRefId;
    return reflector.getDecorators(mod);
  }

  /**
   * For this method to work properly, the root module must be scanned first.
   */
  protected checkAndMarkExternalModule(rawMeta: RootRawMetadata) {
    this.baseMeta.isExternal = false;
    if (isRootModule(rawMeta)) {
      this.rootDeclaredInDir = this.baseMeta.declaredInDir;
    } else if (this.rootDeclaredInDir) {
      const { declaredInDir } = this.baseMeta;
      if (this.rootDeclaredInDir !== '.' && declaredInDir !== '.') {
        // Case when CallsiteUtils.getCallerDir() works correctly.
        this.baseMeta.isExternal =
          !declaredInDir.startsWith(this.rootDeclaredInDir) ||
          (!this.rootDeclaredInDir.includes('ditsmod/packages') && declaredInDir.includes('ditsmod/packages'));
      }
    }
  }

  protected normalizeDeclaredAndResolvedProviders(
    rawMeta: BaseInitRawMeta & PickProps<RootRawMetadata, 'resolvedCollisionsPerApp'>,
  ) {
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      if (rawMeta[`providersPer${level}`]) {
        const providersPerLevel = this.resolveForwardRef(rawMeta[`providersPer${level}`]);
        this.baseMeta[`providersPer${level}`].push(...providersPerLevel);
      }

      if (rawMeta[`resolvedCollisionsPer${level}`]) {
        rawMeta[`resolvedCollisionsPer${level}`]!.forEach(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isModuleWithParams(module)) {
            module.module = resolveForwardRef(module.module);
          }
          this.baseMeta[`resolvedCollisionsPer${level}`].push([token, module]);
        });
      }
    });
  }

  protected normalizeExports(rawMeta: Partial<RootRawMetadata>, action: 'Exports' | 'Exports with params') {
    if (!rawMeta.exports) {
      return;
    }
    let tokens: any[] = [];
    if (this.baseMeta.providersPerMod.length) {
      tokens = getTokens(this.baseMeta.providersPerMod);
    }

    this.resolveForwardRef(rawMeta.exports).forEach((exp, i) => {
      if (exp === undefined) {
        throw new UndefinedSymbol(action, this.baseMeta.name, i);
      }
      if (isNormalizedProvider(exp)) {
        throw new ForbiddenExportNormalizedProvider(this.baseMeta.name, exp.token.name || exp.token);
      }
      if (isModuleWithParams(exp)) {
        this.baseMeta.exportsWithParams.push(exp);
      } else if (isProvider(exp) || tokens.includes(exp)) {
        // Provider or token of provider
        this.exportProviders(exp);
      } else if (this.getDecoratorMeta(exp)) {
        this.baseMeta.exportsModules.push(exp);
      } else {
        throw new ExportingUnknownSymbol(this.baseMeta.name, exp.name || exp);
      }
    });
  }

  protected exportProviders(token: any): void {
    let found = false;
    (['Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
      const providers = this.baseMeta[`providersPer${level}`].filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          this.baseMeta[`exportedMultiProvidersPer${level}`].push(...(providers as MultiProvider[]));
        } else {
          this.baseMeta[`exportedProvidersPer${level}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      if (this.baseMeta.providersPerApp.some((p) => getToken(p) === token)) {
        throw new ForbiddenExportProvidersPerApp(this.baseMeta.name, providerName);
      } else {
        throw new ExportingUnknownSymbol(this.baseMeta.name, providerName);
      }
    }
  }

  protected mergeModuleWithParams(modWitParams: ModuleWithParams) {
    if (modWitParams.id) {
      this.baseMeta.id = modWitParams.id;
    }
    (['providersPerApp', 'providersPerMod', 'providersPerRou', 'providersPerReq'] as const).forEach((prop) => {
      if (modWitParams[prop] instanceof Providers || (Array.isArray(modWitParams[prop]) && modWitParams[prop].length)) {
        this.baseMeta[prop].push(...this.resolveForwardRef(modWitParams[prop]));
      }
    });
    this.normalizeExports(modWitParams, 'Exports with params');
    if (modWitParams.extensionsMeta) {
      this.baseMeta.extensionsMeta = { ...modWitParams.extensionsMeta };
    }
  }

  protected normalizeImports(rawMeta: RootRawMetadata) {
    this.resolveForwardRef(rawMeta.imports).forEach((imp, i) => {
      if (imp === undefined) {
        throw new UndefinedSymbol('Imports', this.baseMeta.name, i);
      }
      if (isModuleWithParams(imp)) {
        this.baseMeta.importsWithParams.push(imp);
      } else {
        this.baseMeta.importsModules.push(imp);
      }
    });
  }

  protected throwIfResolvingNormalizedProvider(
    rawMeta: BaseInitRawMeta & PickProps<RootRawMetadata, 'resolvedCollisionsPerApp'>,
  ) {
    const resolvedCollisionsPerLevel: [any, ModRefId | ForwardRefFn<ModuleType>][] = [];
    if (Array.isArray(rawMeta.resolvedCollisionsPerApp)) {
      resolvedCollisionsPerLevel.push(...rawMeta.resolvedCollisionsPerApp);
    }
    if (Array.isArray(rawMeta.resolvedCollisionsPerMod)) {
      resolvedCollisionsPerLevel.push(...rawMeta.resolvedCollisionsPerMod);
    }

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      provider = resolveForwardRef(provider);
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        throw new ResolvedCollisionTokensOnly(this.baseMeta.name, providerName);
      }
    });
  }

  protected normalizeExtensions(rawMeta: PickProps<ModuleRawMetadata, 'extensions' | 'extensionsMeta'>) {
    if (rawMeta.extensionsMeta) {
      this.baseMeta.extensionsMeta = { ...rawMeta.extensionsMeta, ...this.baseMeta.extensionsMeta };
    }

    rawMeta.extensions?.forEach((extensionOrConfig) => {
      if (!isExtensionConfig(extensionOrConfig)) {
        extensionOrConfig = { extension: extensionOrConfig } as ExtensionConfigBase;
      }
      const extensionObj = getExtensionProvider(extensionOrConfig);
      extensionObj.providers.forEach((p) => this.checkStageMethodsForExtension(this.baseMeta.name, p));
      if (extensionObj.config) {
        this.baseMeta.aExtensionConfig.push(extensionObj.config);
      }
      if (extensionObj.exportedConfig) {
        this.baseMeta.aExportedExtensionConfig.push(extensionObj.exportedConfig);
      }
      this.baseMeta.extensionsProviders.push(...extensionObj.providers);
      this.baseMeta.exportedExtensionsProviders.push(...extensionObj.exportedProviders);
    });
  }

  protected checkStageMethodsForExtension(moduleName: string, extensionsProvider: Provider) {
    const np = normalizeProviders([extensionsProvider])[0];
    let extensionClass: Class<Extension> | undefined;
    if (isClassProvider(np)) {
      extensionClass = resolveForwardRef(np.useClass);
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
      throw new InvalidExtension(moduleName, token.name || token);
    }
  }

  protected checkReexportModules() {
    const imports = [...this.baseMeta.importsModules, ...this.baseMeta.importsWithParams];
    const exports = [...this.baseMeta.exportsModules, ...this.baseMeta.exportsWithParams];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        throw new ReexportFailed(this.baseMeta.name, getDebugClassName(modRefId) || '""');
      }
    });
  }

  /**
   * If the instance with init hooks has `hostRawMeta`, this method
   * inserts a hook that can add `hostRawMeta` to the host module.
   */
  protected addInitHooksForHostDecorator(allInitHooks: AllInitHooks) {
    allInitHooks.forEach((initHooks, decorator) => {
      if (initHooks.hostModule === this.baseMeta.modRefId && initHooks.hostRawMeta) {
        const newInitHooks = initHooks.clone(initHooks.hostRawMeta);
        this.baseMeta.mInitHooks.set(decorator, newInitHooks);
      }
    });
  }

  protected callInitHooksFromCurrentModule() {
    this.baseMeta.mInitHooks.forEach((initHooks, decorator) => {
      this.baseMeta.allInitHooks.set(decorator, initHooks);

      // Importing host module.
      if (initHooks.hostModule === this.baseMeta.modRefId) {
        // No need import host module in host module.
      } else if (isModuleWithParams(initHooks.hostModule)) {
        if (!this.baseMeta.importsWithParams.includes(initHooks.hostModule)) {
          this.baseMeta.importsWithParams.push(initHooks.hostModule);
        }
      } else if (initHooks.hostModule && !this.baseMeta.importsModules.includes(initHooks.hostModule)) {
        this.baseMeta.importsModules.push(initHooks.hostModule);
      }

      this.fetchInitRawMeta(decorator, initHooks.rawMeta);
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
  protected addInitHooksForImportedMwp(allInitHooks: AllInitHooks) {
    (this.baseMeta.modRefId as ModuleWithParams).initParams?.forEach((params, decorator) => {
      if (!this.baseMeta.mInitHooks.has(decorator)) {
        const initHooks = allInitHooks.get(decorator)!;
        const newInitHooks = initHooks.clone();
        this.baseMeta.allInitHooks.set(decorator, newInitHooks);
        this.callInitHook(decorator, newInitHooks);

        // This is need for `this.quickCheckMetadata()` only.
        this.baseMeta.mInitHooks.set(decorator, newInitHooks);
      }
    });
  }

  // prettier-ignore
  protected resolveForwardRef<T extends ModRefId | Provider | ForwardRefFn | { mwp: ModuleWithParams }>(arr = [] as T[] | Providers) {
    return [...arr].map((item) => {
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
    }) as Exclude<T, ForwardRefFn>[];
  }

  protected fetchInitRawMeta(decorator: AnyFn, initRawMeta: BaseInitRawMeta) {
    this.fetchInitImports(decorator, initRawMeta);
    this.fetchInitExports(initRawMeta);
    this.normalizeExtensions(initRawMeta);
    this.normalizeDeclaredAndResolvedProviders(initRawMeta);
  }

  protected fetchInitImports(decorator: AnyFn, initRawMeta: BaseInitRawMeta) {
    if (initRawMeta.imports) {
      this.resolveForwardRef(initRawMeta.imports).forEach((imp) => {
        if (isModuleWithParams(imp)) {
          const params = { ...imp };
          this.mergeInitParams(decorator, params, imp);
        } else if (isParamsWithMwp(imp)) {
          const params = { ...imp } as { mwp?: ModuleWithParams };
          this.mergeObjects(params, imp.mwp);
          delete params.mwp;
          this.mergeInitParams(decorator, params, imp.mwp);
        } else {
          if (!this.baseMeta.importsModules.includes(imp)) {
            this.baseMeta.importsModules.push(imp);
          }
        }
      });
    }
  }

  protected mergeInitParams(decorator: AnyFn, params: AnyObj, mwp: ModuleWithParams) {
    delete params.module;
    delete params.initParams;
    mwp.initParams ??= new Map();
    if (mwp.initParams.has(decorator)) {
      const existingParams = mwp.initParams.get(decorator)!;
      mwp.initParams.set(decorator, this.mergeObjects(params, existingParams));
    } else {
      mwp.initParams.set(decorator, params);
    }
    if (!this.baseMeta.importsWithParams.includes(mwp)) {
      this.baseMeta.importsWithParams.push(mwp);
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

  protected fetchInitExports(initRawMeta: BaseInitRawMeta) {
    if (initRawMeta.exports) {
      this.resolveForwardRef(initRawMeta.exports).forEach((exp) => {
        if (isModuleWithParams(exp)) {
          if (!this.baseMeta.exportsWithParams.includes(exp)) {
            this.baseMeta.exportsWithParams.push(exp);
          }
        } else if (isParamsWithMwp(exp)) {
          if (!this.baseMeta.exportsWithParams.includes(exp.mwp)) {
            this.baseMeta.exportsWithParams.push(exp.mwp);
          }
        } else if (reflector.getDecorators(exp, isFeatureModule)) {
          if (!this.baseMeta.exportsModules.includes(exp)) {
            this.baseMeta.exportsModules.push(exp);
          }
        }
      });
    }
  }

  protected callInitHook(decorator: AnyFn, initHooks: InitHooks) {
    const meta = initHooks.normalize(this.baseMeta);
    if (meta) {
      this.baseMeta.initMeta.set(decorator, meta);
    }
  }

  protected quickCheckMetadata(rawMeta: RootRawMetadata) {
    this.throwIfResolvingNormalizedProvider(rawMeta);
    if (
      isFeatureModule(this.baseMeta) &&
      !this.baseMeta.mInitHooks.size &&
      !this.baseMeta.exportedProvidersPerMod.length &&
      !this.baseMeta.exportedMultiProvidersPerMod.length &&
      !this.baseMeta.exportsModules.length &&
      !this.baseMeta.providersPerApp.length &&
      !this.baseMeta.exportsWithParams.length &&
      !this.baseMeta.exportedExtensionsProviders.length &&
      !this.baseMeta.extensionsProviders.length
    ) {
      throw new ModuleShouldHaveValue();
    }
  }
}
