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
  isModuleWithMetadata,
  isFeatureModule,
} from '#utils/type-guards.js';
import {
  ExtensionConfig,
  getExtensionProvider,
  isConfigWithOverrideExtension,
} from '#extension/get-extension-provider.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { RawMeta } from '#decorators/feature-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { Class } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';
import { Extension, ExtensionClass } from '#extension/extension-types.js';
import { NormalizedProvider, normalizeProviders } from '#utils/ng-utils.js';
import { isExtensionConfig } from '#extension/type-guards.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { mergeArrays } from '#utils/merge-arrays.js';
import { objectKeys } from '#utils/object-keys.js';
import { CustomError } from '#error/custom-error.js';

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
  normalize(modRefId: ModRefId) {
    const aDecoratorMeta = this.getDecoratorMeta(modRefId) || [];
    let rawMeta = aDecoratorMeta.find((d) => isModDecor(d))?.value.metadata as RawMeta | undefined;
    const modName = getDebugClassName(modRefId);
    if (!rawMeta) {
      const msg1 = `Module build failed: module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`;
      throw new CustomError({ msg1, level: 'fatal' });
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

    baseMeta.decorator = rawMeta.decorator;
    baseMeta.declaredInDir = rawMeta.declaredInDir;
    aDecoratorMeta.forEach((decorAndVal) => {
      if (rawMeta.decorator !== decorAndVal.decorator) {
        baseMeta.rawDecorMeta.set(decorAndVal.decorator, decorAndVal.value);
      }
    });
    this.checkAndMarkExternalModule(rawMeta, baseMeta);
    this.normalizeModule(modName, rawMeta, baseMeta);
    this.normalizeDecoratorsMeta(baseMeta);
    this.quickCheckMetadata(baseMeta);
    return baseMeta;
  }

  protected getDecoratorMeta(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const mod = isModuleWithParams(modRefId) ? modRefId.module : modRefId;
    return reflector.getDecorators(mod, isModuleWithMetadata);
  }

  protected mergeModuleWithParams(modWitParams: ModuleWithParams, rawMeta: RawMeta) {
    if (modWitParams.id) {
      rawMeta.id = modWitParams.id;
    }
    objectKeys(modWitParams).forEach((p) => {
      // If here is object with [Symbol.iterator]() method, this transform it to an array.
      if (Array.isArray(modWitParams[p]) || modWitParams[p] instanceof Providers) {
        (rawMeta as any)[p] = mergeArrays((rawMeta as any)[p], modWitParams[p]);
      }
    });

    if (modWitParams.extensionsMeta) {
      rawMeta.extensionsMeta = { ...rawMeta.extensionsMeta, ...modWitParams.extensionsMeta };
    }
    return rawMeta;
  }

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
      imp = resolveForwardRef(imp);
      this.throwIfUndefined(modName, 'Imports', imp, i);
      if (isModuleWithParams(imp)) {
        baseMeta.importsWithParams.push(imp);
      } else {
        baseMeta.importsModules.push(imp);
      }
    });

    this.throwIfResolvingNormalizedProvider(modName, rawMeta);
    this.exportFromReflectMetadata(rawMeta, modName, baseMeta);
    this.checkReexportModules(baseMeta);

    rawMeta.extensions?.forEach((extensionOrConfig, i) => {
      if (!isExtensionConfig(extensionOrConfig)) {
        extensionOrConfig = { extension: extensionOrConfig as ExtensionClass };
      }
      this.checkExtensionConfig(modName, extensionOrConfig, i);
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

    this.pickAndMergeMeta(baseMeta, rawMeta);
  }

  protected throwIfUndefined(modName: string, action: 'Imports' | 'Exports', imp: unknown, i: number) {
    if (imp === undefined) {
      const lowerAction = action.toLowerCase();
      const msg1 =
        `${action} into "${modName}" failed: element at ${lowerAction}[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".';
      throw new CustomError({ msg1, level: 'fatal' });
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
        const msg1 =
          `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
          '"resolvedCollisionPer*" array must be includes tokens only.';
        throw new CustomError({ msg1, level: 'fatal' });
      }
    });
  }

  protected exportFromReflectMetadata(rawMeta: Partial<RawMeta>, modName: string, baseMeta: NormalizedMeta) {
    const providers: Provider[] = [];
    if (Array.isArray(rawMeta.providersPerMod)) {
      providers.push(...rawMeta.providersPerMod);
    }

    rawMeta.exports?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(modName, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(modName, exp);
      if (isModuleWithParams(exp)) {
        baseMeta.exportsWithParams.push(exp);
      } else if (isProvider(exp) || getTokens(providers).includes(exp)) {
        // Provider or token of provider
        this.findAndSetProviders(exp, rawMeta, baseMeta);
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
        const msg1 =
          `Reexport from ${baseMeta.name} failed: ${importedModuleName} includes in exports, but not includes in imports. ` +
          `If in ${baseMeta.name} you imports ${importedModuleName} as module with params, same object you should export (if you need reexport).`;
        throw new CustomError({ msg1, level: 'fatal' });
      }
    });
  }

  protected checkExtensionConfig(modName: string, extensionConfig: ExtensionConfig, i: number) {
    if (!isConfigWithOverrideExtension(extensionConfig)) {
      if (!extensionConfig.extension) {
        const msg1 = `Export of "${modName}" failed: extension in [${i}] index must have "extension" property.`;
        throw new CustomError({ msg1, level: 'fatal' });
      }
    }
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
      const msg1 = `Exporting "${tokenName}" from "${modName}" failed: all extensions must have stage1(), stage2() or stage3() method.`;
      throw new CustomError({ msg1, level: 'fatal' });
    }
  }

  protected pickAndMergeMeta(targetObject: NormalizedMeta, ...sourceObjects: AnyObj[]) {
    const trgtObj = targetObject as any;
    sourceObjects.forEach((sourceObj: AnyObj) => {
      sourceObj ??= {};
      for (const prop in targetObject) {
        if (Array.isArray(sourceObj[prop])) {
          trgtObj[prop] ??= [];
          trgtObj[prop].push(...sourceObj[prop].slice());
        } else if (sourceObj[prop] instanceof Providers) {
          trgtObj[prop] ??= [];
          trgtObj[prop].push(...sourceObj[prop]);
        } else if (sourceObj[prop] && typeof sourceObj[prop] == 'object') {
          trgtObj[prop] = { ...trgtObj[prop], ...(sourceObj[prop] as any) };
        } else if (sourceObj[prop] !== undefined) {
          trgtObj[prop] = sourceObj[prop];
        }
      }
    });

    return trgtObj;
  }

  protected throwUnidentifiedToken(modName: string, token: any) {
    const tokenName = token.name || token;
    const msg1 =
      `Exporting from ${modName} failed: if "${tokenName}" is a token of a provider, this provider ` +
      'must be included in providersPerMod. ' +
      `If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`;
    throw new CustomError({ msg1, level: 'fatal' });
  }

  protected throwExportsIfNormalizedProvider(moduleName: string, provider: NormalizedProvider) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg1 = `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`;
      throw new CustomError({ msg1, level: 'fatal' });
    }
  }

  protected findAndSetProviders(token: any, rawMeta: Partial<RawMeta>, baseMeta: NormalizedMeta): void {
    const unfilteredProviders = [...(rawMeta.providersPerMod || [])];
    const providers = unfilteredProviders.filter((p) => getToken(p) === token);
    if (providers.length) {
      if (providers.some(isMultiProvider)) {
        baseMeta.exportedMultiProvidersPerMod.push(...(providers as MultiProvider[]));
      } else {
        baseMeta.exportedProvidersPerMod.push(...providers);
      }
      return;
    }

    const providerName = token.name || token;
    let msg1 = '';
    const providersPerApp = [...(rawMeta.providersPerApp || [])];
    if (providersPerApp.some((p) => getToken(p) === token)) {
      msg1 =
        `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${baseMeta.name}. ` +
        'This is an error, because "providersPerApp" is always exported automatically.';
    } else {
      msg1 =
        `Exporting from ${baseMeta.name} failed: if "${providerName}" is a provider, it must be included ` +
        'in "providersPerMod".';
    }
    throw new CustomError({ msg1, level: 'fatal' });
  }

  protected normalizeDecoratorsMeta(meta1: NormalizedMeta) {
    meta1.rawDecorMeta.forEach((initHooksAndMetadata, decorator) => {
      const meta2 = initHooksAndMetadata.normalize(meta1, initHooksAndMetadata.metadata);
      if (meta2) {
        meta1.normDecorMeta.set(decorator, meta2);
        meta2?.importsWithParams?.forEach((param) => {
          if (!meta1.importsWithParams.includes(param.modRefId)) {
            meta1.importsWithParams.push(param.modRefId);
          }
        });
      }
    });
  }

  protected quickCheckMetadata(baseMeta: NormalizedMeta) {
    if (
      isFeatureModule(baseMeta) &&
      !baseMeta.rawDecorMeta.size &&
      !baseMeta.exportedProvidersPerMod.length &&
      !baseMeta.exportedMultiProvidersPerMod.length &&
      !baseMeta.exportsModules.length &&
      !baseMeta.providersPerApp.length &&
      !baseMeta.exportsWithParams.length &&
      !baseMeta.exportedExtensionsProviders.length &&
      !baseMeta.extensionsProviders.length
    ) {
      const msg1 = 'this module should have "providersPerApp", or exports, or extensions.';
      throw new CustomError({ msg1, level: 'fatal' });
    }
  }
}
