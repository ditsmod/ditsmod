import {
  isClassProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isValueProvider,
  MultiProvider,
  reflector,
} from '#di';
import { isModuleWithParams, isRootModule, isProvider, isModDecor, isModuleWithMetadata } from '#utils/type-guards.js';
import {
  ExtensionConfig,
  getExtensionProvider,
  isConfigWithOverrideExtension,
} from '#extension/get-extension-provider.js';
import { AnyObj, ModRefId, Level } from '#types/mix.js';
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

export class ModuleNormalizer {
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  /**
   * Returns normalized module metadata.
   */
  normalize(modRefId: ModRefId) {
    const aReflectMetadata = this.getModuleMetadata(modRefId) || [];
    const rawMeta = (aReflectMetadata as RawMeta[]).find(isModDecor);
    const modName = getDebugClassName(modRefId);
    if (!rawMeta) {
      throw new Error(
        `Module build failed: module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`,
      );
    }

    /**
     * Setting initial properties of metadata.
     */
    const meta = new NormalizedMeta();
    meta.name = modName;
    meta.modRefId = modRefId;

    meta.aReflectMetadata = aReflectMetadata;
    meta.decorator = rawMeta.decorator;
    meta.declaredInDir = rawMeta.declaredInDir;
    this.checkAndMarkExternalModule(isRootModule(rawMeta), meta);

    aReflectMetadata.forEach((reflectMetadata) => {
      (reflectMetadata.imports as undefined | ModRefId[])?.forEach((imp, i) => {
        imp = resolveForwardRef(imp);
        this.throwIfUndefined(modName, 'Imports', imp, i);
        if (isModuleWithParams(imp)) {
          meta.importsWithParams.push(imp);
        } else {
          // @todo check type of imported symbol
          meta.importsModules.push(imp);
        }
      });

      this.throwIfResolvingNormalizedProvider(modName, reflectMetadata);
      this.exportFromReflectMetadata(reflectMetadata, modName, meta);
      this.checkReexportModules(meta);

      (reflectMetadata.extensions as undefined | (ExtensionConfig | ExtensionClass)[])?.forEach(
        (extensionOrConfig, i) => {
          if (!isExtensionConfig(extensionOrConfig)) {
            extensionOrConfig = { extension: extensionOrConfig as ExtensionClass };
          }
          this.checkExtensionConfig(modName, extensionOrConfig, i);
          const extensionObj = getExtensionProvider(extensionOrConfig);
          extensionObj.providers.forEach((p) => this.checkInitMethodForExtension(modName, p));
          if (extensionObj.config) {
            meta.aExtensionConfig.push(extensionObj.config);
          }
          if (extensionObj.exportedConfig) {
            meta.aExportedExtensionConfig.push(extensionObj.exportedConfig);
          }
          meta.extensionsProviders.push(...extensionObj.providers);
          meta.exportedExtensionsProviders.push(...extensionObj.exportedProviders);
        },
      );

      this.pickAndMergeMeta(meta, reflectMetadata);
    });

    return meta;
  }

  protected getModuleMetadata(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    if (isModuleWithParams(modRefId)) {
      return reflector.getDecorators(modRefId.module, isModuleWithMetadata)?.map((decorAndVal) => {
        return decorAndVal.value.mergeModuleWithParams?.(modRefId, decorAndVal) || decorAndVal.value.metadata;
      });
    } else {
      return reflector.getDecorators(modRefId, isModuleWithMetadata)?.map((decorAndVal) => decorAndVal.value.metadata);
    }
  }

  protected checkExtensionConfig(modName: string, extensionConfig: ExtensionConfig, i: number) {
    if (!isConfigWithOverrideExtension(extensionConfig)) {
      if (!extensionConfig.extension) {
        const msg = `Export of "${modName}" failed: extension in [${i}] index must have "extension" property.`;
        throw new TypeError(msg);
      }
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

  protected checkAndMarkExternalModule(isRootModule: boolean, meta: NormalizedMeta) {
    meta.isExternal = false;
    if (isRootModule) {
      this.rootDeclaredInDir = meta.declaredInDir;
    } else if (this.rootDeclaredInDir) {
      const { declaredInDir } = meta;
      if (this.rootDeclaredInDir !== '.' && declaredInDir !== '.') {
        // Case when CallsiteUtils.getCallerDir() works correctly.
        meta.isExternal = !declaredInDir.startsWith(this.rootDeclaredInDir);
      }
    }
  }

  protected exportFromReflectMetadata(reflectMetadata: AnyObj, modName: string, meta: NormalizedMeta) {
    const providers: Provider[] = [];
    Object.keys(reflectMetadata).forEach((k) => {
      if (k.includes('providers') && Array.isArray(reflectMetadata[k])) {
        providers.push(...reflectMetadata[k]);
      }
    });

    (reflectMetadata.exports as undefined | any[])?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(modName, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(modName, exp);
      if (isModuleWithParams(exp)) {
        meta.exportsWithParams.push(exp);
        // if (exp.exports?.length) {
        //   this.exportFromRawMeta(exp, modName, meta);
        // }
      } else if (isProvider(exp) || getTokens(providers).includes(exp)) {
        this.findAndSetProviders(exp, reflectMetadata, meta);
      } else if (this.getModuleMetadata(exp)) {
        meta.exportsModules.push(exp);
      } else {
        this.throwUnidentifiedToken(modName, exp);
      }
    });
  }

  protected checkReexportModules(meta: NormalizedMeta) {
    const imports = [...meta.importsModules, ...meta.importsWithParams];
    const exports = [...meta.exportsModules, ...meta.exportsWithParams];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        const importedModuleName = getDebugClassName(modRefId);
        const msg =
          `Reexport from ${meta.name} failed: ${importedModuleName} includes in exports, but not includes in imports. ` +
          `If in ${meta.name} you imports ${importedModuleName} as module with params, same object you should export (if you need reexport).`;
        throw new Error(msg);
      }
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

  protected checkInitMethodForExtension(modName: string, extensionsProvider: Provider) {
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
      throw new TypeError(msg);
    }
  }

  protected throwUnidentifiedToken(modName: string, token: any) {
    const tokenName = token.name || token;
    const msg =
      `Exporting from ${modName} failed: if "${tokenName}" is a token of a provider, this provider ` +
      'must be included in providersPerReq or in providersPerRou, or in providersPerMod. ' +
      `If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`;
    throw new TypeError(msg);
  }

  protected throwIfResolvingNormalizedProvider(moduleName: string, obj: AnyObj) {
    const resolvedCollisionsPerLevel: [any, ModRefId][] = [];
    Object.keys(obj).forEach((k) => {
      if (k.includes('resolvedCollision') && Array.isArray(obj[k])) {
        resolvedCollisionsPerLevel.push(...obj[k]);
      }
    });

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        const msg =
          `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
          '"resolvedCollisionPer*" array must be includes tokens only.';
        throw new TypeError(msg);
      }
    });
  }

  protected throwExportsIfNormalizedProvider(moduleName: string, provider: NormalizedProvider) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg = `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`;
      throw new TypeError(msg);
    }
  }

  protected findAndSetProviders(token: any, reflectMetadata: AnyObj, meta: NormalizedMeta) {
    const levels: Level[] = [];
    const providersPer = 'providersPer';
    Object.keys(reflectMetadata).forEach((k) => {
      const index = k.indexOf(providersPer);
      if (index !== -1) {
        const level = k.slice(index + providersPer.length) as Level;
        if (level != 'App' as Level) {
          levels.push(level);
        }
      }
    });

    let found = false;
    levels.forEach((level) => {
      const unfilteredProviders = [...(reflectMetadata[`providersPer${level}`] || [])];
      const providers = unfilteredProviders.filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          meta[`exportedMultiProvidersPer${level}`] ??= [];
          meta[`exportedMultiProvidersPer${level}`].push(...(providers as MultiProvider[]));
        } else {
          meta[`exportedProvidersPer${level}`] ??= [];
          meta[`exportedProvidersPer${level}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      let msg = '';
      const providersPerApp = [...(reflectMetadata.providersPerApp || [])];
      if (providersPerApp.some((p) => getToken(p) === token)) {
        msg =
          `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${meta.name}. ` +
          'This is an error, because "providersPerApp" is always exported automatically.';
      } else {
        msg =
          `Exporting from ${meta.name} failed: if "${providerName}" is a provider, it must be included ` +
          'in "providersPerMod".';
      }
      throw new Error(msg);
    }
  }
}
