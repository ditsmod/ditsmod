import { isClassProvider, isMultiProvider, isNormalizedProvider, isTokenProvider, isValueProvider, MultiProvider } from '#di';
import {
  isModDecor,
  isModuleWithParams,
  isRootModule,
  isProvider,
} from '#utils/type-guards.js';
import {
  ExtensionConfig,
  getExtensionProvider,
  isConfigWithOverrideExtension,
} from '#extension/get-extension-provider.js';
import { AnyObj, ModRefId, Level } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { RawMeta } from '#decorators/module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { Class } from '#di/types-and-models.js';
import { reflector } from '#di/reflection.js';
import { Providers } from '#utils/providers.js';
import { ModuleMetadata } from '#types/module-metadata.js';
import { getModule } from '#utils/get-module.js';
import { Extension } from '#extension/extension-types.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { mergeArrays } from '#utils/merge-arrays.js';

export class ModuleNormalizer {
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  /**
   * Returns normalized module metadata.
   */
  normalize(modRefId: ModRefId) {
    const rawMeta = getModuleMetadata(modRefId);
    const modName = getDebugClassName(modRefId);
    if (!rawMeta) {
      throw new Error(`Module build failed: module "${modName}" does not have the "@featureModule()" decorator`);
    }

    /**
     * Setting initial properties of metadata.
     */
    const meta = new NormalizedModuleMetadata();
    meta.rawMeta = Object.freeze(rawMeta);
    meta.name = modName;
    meta.modRefId = modRefId;
    meta.decorator = rawMeta.decorator;
    meta.declaredInDir = rawMeta.declaredInDir;
    this.checkWhetherIsExternalModule(rawMeta, meta);
    // if (rawMeta.guards.length) {
    //   meta.guardsPerMod.push(...this.normalizeGuards(rawMeta.guards));
    //   this.checkGuardsPerMod(meta.guardsPerMod, modName);
    // }

    rawMeta.imports?.forEach((imp, i) => {
      imp = resolveForwardRef(imp);
      this.throwIfUndefined(modName, 'Imports', imp, i);
      if (isModuleWithParams(imp)) {
        meta.importsWithParams.push(imp);
      } else {
        meta.importsModules.push(imp);
      }
    });

    // rawMeta.appends?.forEach((ap, i) => {
    //   ap = resolveForwardRef(ap);
    //   this.throwIfUndefined(modName, 'Appends', ap, i);
    //   if (isAppendsWithParams(ap)) {
    //     meta.appendsWithParams.push(ap);
    //   } else {
    //     meta.appendsModules.push(ap);
    //   }
    // });

    const providersTokens = getTokens([
      ...(rawMeta.providersPerMod || []),
      ...(rawMeta.providersPerRou || []),
      ...(rawMeta.providersPerReq || []),
    ]);

    const resolvedCollisionsPerLevel = [
      ...(rawMeta.resolvedCollisionsPerMod || []),
      ...(rawMeta.resolvedCollisionsPerRou || []),
      ...(rawMeta.resolvedCollisionsPerReq || []),
    ];
    if (isRootModule(rawMeta)) {
      resolvedCollisionsPerLevel.push(...(rawMeta.resolvedCollisionsPerApp || []));
    }
    resolvedCollisionsPerLevel.forEach(([token]) => this.throwIfNormalizedProvider(modName, token));
    this.exportFromRawMeta(rawMeta, modName, providersTokens, meta);
    this.checkReexportModules(meta);

    rawMeta.extensions?.forEach((extensionConfig, i) => {
      this.checkExtensionConfig(modName, extensionConfig, i);
      const extensionObj = getExtensionProvider(extensionConfig);
      extensionObj.providers.forEach((p) => this.checkInitMethodForExtension(modName, p));
      if (extensionObj.config) {
        meta.aExtensionConfig.push(extensionObj.config);
      }
      if (extensionObj.exportedConfig) {
        meta.aExportedExtensionConfig.push(extensionObj.exportedConfig);
      }
      meta.extensionsProviders.push(...extensionObj.providers);
      meta.exportedExtensionsProviders.push(...extensionObj.exportedProviders);
    });

    // @todo Refactor the logic with the `pickMeta()` call, as it may override previously set values in `meta`.
    this.pickMeta(meta, rawMeta);
    meta.extensionsMeta = { ...(meta.extensionsMeta || {}) };
    this.quickCheckMetadata(meta);
    // meta.controllers.forEach((Controller) => this.checkController(modName, Controller));

    return meta;
  }

  // protected checkController(modName: string, Controller: Class) {
  //   if (!reflector.getDecorators(Controller, isCtrlDecor)) {
  //     throw new Error(
  //       `Collecting controller's metadata in ${modName} failed: class ` +
  //         `"${Controller.name}" does not have the "@controller()" decorator.`,
  //     );
  //   }
  // }

  protected checkExtensionConfig(modName: string, extensionConfig: ExtensionConfig, i: number) {
    if (!isConfigWithOverrideExtension(extensionConfig)) {
      if (!extensionConfig.group) {
        const msg = `Export of "${modName}" failed: extension in [${i}] index must have "group" property.`;
        throw new TypeError(msg);
      }
    }
  }

  protected pickMeta(targetObject: NormalizedModuleMetadata, ...sourceObjects: RawMeta[]) {
    const trgtObj = targetObject as any;
    sourceObjects.forEach((sourceObj: AnyObj) => {
      sourceObj ??= {};
      for (const prop in targetObject) {
        if (Array.isArray(sourceObj[prop])) {
          trgtObj[prop] = sourceObj[prop].slice();
        } else if (sourceObj[prop] instanceof Providers) {
          trgtObj[prop] = [...sourceObj[prop]];
        } else if (sourceObj[prop] !== undefined) {
          trgtObj[prop] = sourceObj[prop] as any;
        }
      }
    });

    return trgtObj;
  }

  protected checkWhetherIsExternalModule(rawMeta: RawMeta, meta: NormalizedModuleMetadata) {
    meta.isExternal = false;
    if (isRootModule(rawMeta)) {
      this.rootDeclaredInDir = meta.declaredInDir;
    } else if (this.rootDeclaredInDir) {
      const { declaredInDir } = meta;
      if (this.rootDeclaredInDir !== '.' && declaredInDir !== '.') {
        // Case when CallsiteUtils.getCallerDir() works correctly.
        meta.isExternal = !declaredInDir.startsWith(this.rootDeclaredInDir);
      }
    }
  }

  protected exportFromRawMeta(
    rawMeta: ModuleMetadata,
    modName: string,
    providersTokens: any[],
    meta: NormalizedModuleMetadata,
  ) {
    rawMeta.exports?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(modName, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(modName, exp);
      if (isModuleWithParams(exp)) {
        meta.exportsWithParams.push(exp);
        if (exp.exports?.length) {
          this.exportFromRawMeta(exp, modName, providersTokens, meta);
        }
      } else if (isProvider(exp) || providersTokens.includes(exp)) {
        this.findAndSetProviders(exp, rawMeta, meta);
      } else if (getModuleMetadata(exp)) {
        meta.exportsModules.push(exp);
      } else {
        this.throwUnidentifiedToken(modName, exp);
      }
    });
  }

  protected checkReexportModules(meta: NormalizedModuleMetadata) {
    const imports = [...meta.importsModules, ...meta.importsWithParams].map(getModule);
    const exports = [...meta.exportsModules, ...meta.exportsWithParams].map(getModule);

    exports.forEach((mod) => {
      if (!imports.includes(mod)) {
        const msg =
          `Reexport from ${meta.name} failed: ${mod.name} includes in exports, but not includes in imports. ` +
          `In ${meta.name} you need include ${mod.name} to imports or remove it from exports.`;
        throw new Error(msg);
      }
    });
  }

  // protected normalizeGuards(guards?: GuardItem[]) {
  //   return (guards || []).map((item) => {
  //     if (Array.isArray(item)) {
  //       return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
  //     } else {
  //       return { guard: item } as NormalizedGuard;
  //     }
  //   });
  // }

  // protected checkGuardsPerMod(guards: NormalizedGuard[], moduleName: string) {
  //   for (const Guard of guards.map((n) => n.guard)) {
  //     const type = typeof Guard?.prototype.canActivate;
  //     if (type != 'function') {
  //       throw new TypeError(
  //         `Import ${moduleName} with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`,
  //       );
  //     }
  //   }
  // }

  protected quickCheckMetadata(meta: NormalizedModuleMetadata) {
    if (
      !isRootModule(meta) &&
      // !meta.exportedProvidersPerReq.length &&
      // !meta.controllers.length &&
      !meta.exportedProvidersPerMod.length &&
      // !meta.exportedProvidersPerRou.length &&
      !meta.exportsModules.length &&
      !meta.exportsWithParams.length &&
      !meta.exportedMultiProvidersPerMod.length &&
      // !meta.exportedMultiProvidersPerRou.length &&
      // !meta.exportedMultiProvidersPerReq.length &&
      !meta.providersPerApp.length &&
      !meta.exportedExtensionsProviders.length &&
      !meta.extensionsProviders.length
      // !meta.appendsWithParams.length
    ) {
      const msg = 'this module should have "providersPerApp" or some controllers, or exports, or extensions.';
      throw new Error(msg);
    }
  }

  protected throwIfUndefined(
    modName: string,
    action: 'Imports' | 'Exports' | 'Appends',
    imp: ModRefId | Provider,
    i: number,
  ) {
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

  protected throwIfNormalizedProvider(moduleName: string, provider: any) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg =
        `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
        '"resolvedCollisionPer*" array must be includes tokens only.';
      throw new TypeError(msg);
    }
  }

  protected throwExportsIfNormalizedProvider(moduleName: string, provider: any) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg = `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`;
      throw new TypeError(msg);
    }
  }

  protected findAndSetProviders(token: any, rawMeta: ModuleMetadata, meta: NormalizedModuleMetadata) {
    const levels: Level[] = ['Mod'];
    let found = false;
    levels.forEach((level) => {
      const unfilteredProviders = [...(rawMeta[`providersPer${level}`] || [])];
      const providers = unfilteredProviders.filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          meta[`exportedMultiProvidersPer${level}`].push(...(providers as MultiProvider[]));
        } else {
          meta[`exportedProvidersPer${level}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      let msg = '';
      const providersPerApp = [...(rawMeta.providersPerApp || [])];
      if (providersPerApp.some((p) => getToken(p) === token)) {
        msg =
          `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${meta.name}. ` +
          'This is an error, because "providersPerApp" is always exported automatically.';
      } else {
        msg =
          `Exporting from ${meta.name} failed: if "${providerName}" is a provider, it must be included ` +
          'in "providersPerMod" or "providersPerRou", or "providersPerReq".';
      }
      throw new Error(msg);
    }
  }
}

/**
 * Merges metadata passed in `rootModule` or `featureModule` decorators with metadata passed
 * in `ModuleWithParams`.
 */

export function getModuleMetadata(modRefId: ModRefId, isRoot?: boolean): RawMeta | undefined {
  modRefId = resolveForwardRef(modRefId);
  const decoratorGuard = isRoot ? isRootModule : isModDecor;

  // if (!isModuleWithParams(modRefId) && !isAppendsWithParams(modRefId)) {
  if (!isModuleWithParams(modRefId)) {
    return reflector.getDecorators(modRefId, decoratorGuard)?.at(0)?.value;
  }

  const modWitParams = modRefId;
  const decorAndVal = reflector.getDecorators(modWitParams.module, decoratorGuard)?.at(0);
  if (!decorAndVal) {
    return;
  }
  const modMetadata = decorAndVal.value;

  if (modMetadata.id) {
    const modName = getDebugClassName(modWitParams.module);
    const msg =
      `${modName} must not have an "id" in the metadata of the decorator @featureModule. ` +
      'Instead, you can specify the "id" in the object that contains the module parameters.';
    throw new Error(msg);
  }
  const metadata = Object.assign({}, modMetadata);
  metadata.id = modWitParams.id;
  const levels = ['App', 'Mod', 'Rou', 'Req'] as Level[];
  if (isModuleWithParams(modWitParams)) {
    levels.forEach((level) => {
      const arr1 = modMetadata[`providersPer${level}`];
      const arr2 = modWitParams[`providersPer${level}`];
      metadata[`providersPer${level}`] = getLastProviders(mergeArrays(arr1, arr2));
    });
    metadata.exports = getLastProviders(mergeArrays(modMetadata.exports, modWitParams.exports));
    metadata.extensionsMeta = { ...modMetadata.extensionsMeta, ...modWitParams.extensionsMeta };
  }
  // metadata.guards = modRefId.guards || [];
  return metadata;
}
