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
} from '#utils/type-guards.js';
import { ExtensionConfigBase, getExtensionProvider } from '#extension/get-extension-provider.js';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ParamsTransferObj, RawMeta } from '#decorators/feature-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { Class } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';
import { Extension } from '#extension/extension-types.js';
import { NormalizedProvider, normalizeProviders } from '#utils/ng-utils.js';
import { isExtensionConfig } from '#extension/type-guards.js';
import { ModuleWithParams, ModuleWithSrcInitMeta } from '#types/module-metadata.js';
import { mergeArrays } from '#utils/merge-arrays.js';
import { AllInitHooks } from './module-manager.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';

/**
 * Normalizes and validates module metadata.
 */
export class ModuleNormalizer {
  protected mapOfParams: Map<ModuleWithSrcInitMeta, Map<AnyFn, ParamsTransferObj>>;
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
      const msg = 'The passed argument modRefId is not a class, and is not a module with a parameter.';
      throw new TypeError(msg);
    }
    if (!rawMeta) {
      const msg = `module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`;
      throw new Error(msg);
    }
    if (isModuleWithParams(modRefId)) {
      rawMeta = this.mergeModuleWithParams(modRefId, rawMeta);
    }

    /**
     * Setting initial properties of metadata.
     */
    const baseMeta = new NormalizedMeta();
    baseMeta.name = modName;
    baseMeta.modRefId = modRefId;
    aDecoratorMeta.filter(isModuleWithInitHooks).forEach((decorAndVal) => {
      baseMeta.mInitHooksAndRawMeta.set(decorAndVal.decorator, decorAndVal.value);
    });
    this.checkAndMarkExternalModule(rawMeta, baseMeta);
    this.normalizeModule(modName, rawMeta, baseMeta);
    this.pickAndMergeMeta(baseMeta, rawMeta);
    this.addInitHooksForHostDecorator(baseMeta, allInitHooks);
    this.callInitHooksFromCurrentModule(baseMeta, allInitHooks);
    this.addInitHooksFromModuleUsageContext(baseMeta, allInitHooks);
    this.quickCheckMetadata(baseMeta);
    return baseMeta;
  }

  protected getDecoratorMeta(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const mod = isModuleWithParams(modRefId) ? modRefId.module : modRefId;
    return reflector.getDecorators(mod);
  }

  protected mergeModuleWithParams(modWitParams: ModuleWithParams, rawMeta: RawMeta) {
    if (modWitParams.id) {
      rawMeta.id = modWitParams.id;
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
  protected checkAndMarkExternalModule(rawMeta: RawMeta, baseMeta: NormalizedMeta) {
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

  protected normalizeModule(modName: string, rawMeta: RawMeta, baseMeta: NormalizedMeta) {
    rawMeta.imports?.forEach((imp, i) => {
      imp = this.resolveForwardRef([imp])[0];
      this.throwIfUndefined(modName, 'Imports', imp, i);
      if (isModuleWithParams(imp)) {
        baseMeta.importsWithParams.push(imp);
      } else {
        baseMeta.importsModules.push(imp);
      }
    });

    this.throwIfResolvingNormalizedProvider(modName, rawMeta);
    this.exportModules(rawMeta, modName, baseMeta);
    this.checkReexportModules(baseMeta);

    rawMeta.extensions?.forEach((extensionOrConfig, i) => {
      if (!isExtensionConfig(extensionOrConfig)) {
        extensionOrConfig = { extension: extensionOrConfig } as ExtensionConfigBase;
      }
      const extensionObj = getExtensionProvider(extensionOrConfig);
      extensionObj.providers.forEach((p) => this.checkStageMethodsForExtension(modName, p));
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

  protected throwIfUndefined(modName: string, action: 'Imports' | 'Exports', imp: unknown, i: number) {
    if (imp === undefined) {
      const lowerAction = action.toLowerCase();
      const msg =
        `${action} into "${modName}" failed: element at ${lowerAction}[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".';
      throw new Error(msg);
    }
  }

  protected throwIfResolvingNormalizedProvider(moduleName: string, rawMeta: RawMeta) {
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
        const msg =
          `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
          '"resolvedCollisionPer*" array must be includes tokens only.';
        throw new Error(msg);
      }
    });
  }

  protected exportModules(rawMeta: Partial<RawMeta>, modName: string, baseMeta: NormalizedMeta) {
    const providers: Provider[] = [];
    if (Array.isArray(rawMeta.providersPerMod)) {
      providers.push(...rawMeta.providersPerMod);
    }

    rawMeta.exports?.forEach((exp, i) => {
      exp = this.resolveForwardRef([exp])[0];
      this.throwIfUndefined(modName, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(modName, exp);
      if (isModuleWithParams(exp)) {
        baseMeta.exportsWithParams.push(exp);
      } else if (isProvider(exp) || getTokens(providers).includes(exp)) {
        // Provider or token of provider
        this.exportProviders(exp, rawMeta, baseMeta);
      } else if (this.getDecoratorMeta(exp)) {
        baseMeta.exportsModules.push(exp);
      } else {
        this.throwUnidentifiedToken(modName, exp);
      }
    });
  }

  protected checkReexportModules(baseMeta: NormalizedMeta) {
    const imports = [...baseMeta.importsModules, ...baseMeta.importsWithParams];
    const exports = [...baseMeta.exportsModules, ...baseMeta.exportsWithParams];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        const importedModuleName = getDebugClassName(modRefId);
        const msg =
          `Reexport from ${baseMeta.name} failed: ${importedModuleName} includes in exports, but not includes in imports. ` +
          `If in ${baseMeta.name} you imports ${importedModuleName} as module with params, same object you should export (if you need reexport).`;
        throw new Error(msg);
      }
    });
  }

  protected checkStageMethodsForExtension(modName: string, extensionsProvider: Provider) {
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
      const tokenName = token.name || token;
      const msg = `Exporting "${tokenName}" from "${modName}" failed: all extensions must have stage1(), stage2() or stage3() method.`;
      throw new Error(msg);
    }
  }

  protected pickAndMergeMeta(targetObject: NormalizedMeta, ...sourceObjects: AnyObj[]) {
    const trgtObj = targetObject as any;
    sourceObjects.forEach((sourceObj: AnyObj) => {
      sourceObj ??= {};
      for (const prop in targetObject) {
        if (prop.startsWith('resolvedCollisions') && Array.isArray(sourceObj[prop])) {
          trgtObj[prop].push(...sourceObj[prop].slice());
          trgtObj[prop] = (trgtObj[prop] as [any, ModuleWithParams | ModuleType][]).map(([token, module]) => {
            token = resolveForwardRef(token);
            module = resolveForwardRef(module);
            if (isModuleWithParams(module)) {
              module.module = resolveForwardRef(module.module);
            }
            return [token, module];
          });
        } else if (Array.isArray(sourceObj[prop])) {
          trgtObj[prop].push(...sourceObj[prop].slice());
          trgtObj[prop] = this.resolveForwardRef(trgtObj[prop]);
        } else if (sourceObj[prop] instanceof Providers) {
          trgtObj[prop].push(...sourceObj[prop]);
          trgtObj[prop] = this.resolveForwardRef(trgtObj[prop]);
        } else if (sourceObj[prop] && typeof sourceObj[prop] == 'object') {
          trgtObj[prop] = { ...trgtObj[prop], ...(sourceObj[prop] as any) };
        } else if (sourceObj[prop] !== undefined) {
          trgtObj[prop] = sourceObj[prop];
        }
      }
    });

    return trgtObj;
  }

  protected resolveForwardRef<T extends ModRefId | Provider>(arr: T[]) {
    return arr.map((item) => {
      item = resolveForwardRef(item);
      if (isNormalizedProvider(item)) {
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

  protected throwUnidentifiedToken(modName: string, token: any) {
    const tokenName = token.name || token;
    const msg =
      `Exporting from ${modName} failed: if "${tokenName}" is a token of a provider, this provider ` +
      'must be included in providersPerMod. ' +
      `If "${tokenName}" is a module, it must have "featureModule" decorator. ` +
      `If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`;
    throw new Error(msg);
  }

  protected throwExportsIfNormalizedProvider(moduleName: string, provider: NormalizedProvider) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg = `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`;
      throw new Error(msg);
    }
  }

  protected exportProviders(token: any, rawMeta: Partial<RawMeta>, baseMeta: NormalizedMeta): void {
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
    let msg = '';
    const providersPerApp = [...(rawMeta.providersPerApp || [])];
    if (providersPerApp.some((p) => getToken(p) === token)) {
      msg =
        `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${baseMeta.name}. ` +
        'This is an error, because "providersPerApp" is always exported automatically.';
    } else {
      msg =
        `Exporting from ${baseMeta.name} failed: if "${providerName}" is a module, it must have "featureModule" decorator; ` +
        `if "${providerName}" is a provider, it must be included in "providersPerMod".`;
    }
    throw new Error(msg);
  }

  protected addInitHooksForHostDecorator(baseMeta: NormalizedMeta, allInitHooks: AllInitHooks) {
    allInitHooks.forEach((initHooks, decorator) => {
      if (initHooks.hostModule === baseMeta.modRefId) {
        if (initHooks.hostRawMeta) {
          const newInitHooksAndRawMeta = initHooks.clone(initHooks.hostRawMeta);
          baseMeta.mInitHooksAndRawMeta.set(decorator, newInitHooksAndRawMeta);
        }
      }
    });
  }

  protected callInitHooksFromCurrentModule(baseMeta: NormalizedMeta, allInitHooks: AllInitHooks) {
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

      // Setting params for imported modules.
      initHooks.rawMeta.importsWithParams?.forEach((params) => {
        if (isModuleWithParams(params.modRefId)) {
          (params.modRefId as ModuleWithSrcInitMeta).srcInitMeta = baseMeta.initMeta;
        } else {
          params.modRefId = { module: params.modRefId, srcInitMeta: baseMeta.initMeta } as ModuleWithSrcInitMeta;
        }
      });

      this.callInitHook(baseMeta, decorator, initHooks);
    });
  }

  /**
   * If the current module was used with parameters in the context of init decorators, but
   * the class of the current module is not annotated with those decorators, then retrieve
   * the corresponding init hooks (for reading parameters) from the `allInitHooks`.
   */
  protected addInitHooksFromModuleUsageContext(baseMeta: NormalizedMeta, allInitHooks: AllInitHooks) {
    (baseMeta.modRefId as ModuleWithSrcInitMeta).srcInitMeta?.forEach((params, decorator) => {
      if (!baseMeta.mInitHooksAndRawMeta.get(decorator)) {
        const initHooks = allInitHooks.get(decorator)!;
        const newInitHooksAndRawMeta = initHooks.clone();
        this.callInitHook(baseMeta, decorator, newInitHooksAndRawMeta);
        baseMeta.mInitHooksAndRawMeta.set(decorator, newInitHooksAndRawMeta);
      }
    });
  }

  protected callInitHook(baseMeta: NormalizedMeta, decorator: AnyFn, initHooks: InitHooksAndRawMeta) {
    const meta = initHooks.normalize(baseMeta);
    if (meta) {
      baseMeta.initMeta.set(decorator, meta);
      meta?.importsWithParams?.forEach((param) => {
        if (!baseMeta.importsWithParams.includes(param.modRefId)) {
          baseMeta.importsWithParams.push(param.modRefId);
        }
      });
    }
  }

  protected quickCheckMetadata(baseMeta: NormalizedMeta) {
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
      const msg = 'this module should have "providersPerApp", or exports, or extensions.';
      throw new Error(msg);
    }
  }
}
