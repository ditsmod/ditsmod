import {
  AnyObj,
  Class,
  getToken,
  getTokens,
  isFeatureModule,
  isModuleWithSrcInitMeta,
  isMultiProvider,
  isNormalizedProvider,
  isProvider,
  mergeArrays,
  ModuleType,
  ModuleWithParams,
  MultiProvider,
  NormalizedMeta,
  NormalizedProvider,
  Providers,
  reflector,
  resolveForwardRef,
  getDuplicates,
  CustomError,
  isModuleWithParams,
  getDebugClassName,
  Provider,
  isClassProvider,
  isTokenProvider,
  ModuleWithSrcInitMeta,
  InitMetaMap,
  isParamsWithModRefId,
  Override,
} from '@ditsmod/core';

import { RestMetadata, RestModuleParams } from '#init/module-metadata.js';
import { RestModRefId, RestNormalizedMeta } from '#init/rest-normalized-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

/**
 * Normalizes and validates module metadata.
 */
export class ModuleNormalizer {
  normalize(baseMeta: NormalizedMeta, rawMeta: RestMetadata) {
    const meta = new RestNormalizedMeta();
    this.mergeModuleWithParams(baseMeta.modRefId, rawMeta, meta);
    this.appendModules(rawMeta, meta);
    this.pickAndMergeMeta(meta, rawMeta);
    this.exportModules(baseMeta, rawMeta, meta);
    this.checkMetadata(baseMeta, meta);
    return meta;
  }

  protected mergeModuleWithParams(modRefId: RestModRefId, rawMeta: RestMetadata, meta: RestNormalizedMeta): void {
    if (isAppendsWithParams(modRefId)) {
      if (modRefId.absolutePath !== undefined) {
        meta.params.absolutePath = modRefId.absolutePath;
      }
      if (modRefId.path !== undefined) {
        meta.params.path = modRefId.path;
      }
      meta.params.guards.push(...this.normalizeGuards(modRefId.guards));
      return;
    } else if (!isModuleWithSrcInitMeta(modRefId)) {
      return;
    }
    const initMeta = modRefId.srcInitMeta.get(initRest);
    const params = initMeta?.importsWithParams.find((param) => param.modRefId === modRefId);

    if (params) {
      (['exports', 'providersPerRou', 'providersPerReq'] as const).forEach((prop) => {
        if (params[prop] instanceof Providers || params[prop]?.length) {
          rawMeta[prop] = mergeArrays(rawMeta[prop], params[prop]);
        }
      });

      if (params.absolutePath !== undefined) {
        meta.params.absolutePath = params.absolutePath;
      }
      if (params.path !== undefined) {
        meta.params.path = params.path;
      }
      meta.params.guards.push(...this.normalizeGuards(params.guards));
    }
  }

  protected appendModules(rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    rawMeta.appends?.forEach((ap, i) => {
      ap = this.resolveForwardRef([ap])[0];
      this.throwIfUndefined(ap, i);
      if (isAppendsWithParams(ap)) {
        if ((ap as ModuleWithSrcInitMeta).srcInitMeta) {
          (ap as ModuleWithSrcInitMeta).srcInitMeta.set(initRest, meta);
        } else {
          (ap as ModuleWithSrcInitMeta).srcInitMeta = new Map([[initRest, meta]]) as InitMetaMap;
        }
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsModules.push(ap);
      }
    });
  }

  protected pickAndMergeMeta(meta: RestNormalizedMeta, rawMeta: RestMetadata) {
    if (rawMeta.controllers) {
      meta.controllers.push(...rawMeta.controllers);
    }
    (['Rou', 'Req'] as const).forEach((level) => {
      if (rawMeta[`providersPer${level}`]) {
        meta[`providersPer${level}`].push(...rawMeta[`providersPer${level}`]!);
        meta[`providersPer${level}`] = this.resolveForwardRef(meta[`providersPer${level}`]);
      }

      if (rawMeta[`resolvedCollisionsPer${level}`]) {
        meta[`resolvedCollisionsPer${level}`].push(...rawMeta[`resolvedCollisionsPer${level}`]!);
        meta[`resolvedCollisionsPer${level}`] = meta[`resolvedCollisionsPer${level}`].map(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isModuleWithParams(module)) {
            module.module = resolveForwardRef(module.module);
          }
          return [token, module];
        });
      }
    });

    rawMeta.imports?.forEach((imp) => {
      if (isParamsWithModRefId(imp)) {
        meta.importsWithParams.push(imp as Override<RestModuleParams, { modRefId: ModuleWithSrcInitMeta }>);
      } else {
        if (isModuleWithParams(imp)) {
          meta.importsWithParams.push({ modRefId: imp as ModuleWithSrcInitMeta });
        } else {
          meta.importsModules.push(imp);
        }
      }
    });

    return meta;
  }

  protected resolveForwardRef<T extends RestModRefId | Provider>(arr: T[]) {
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

  protected exportModules(baseMeta: NormalizedMeta, rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    if (!rawMeta.exports) {
      return;
    }
    const providers = meta.providersPerRou.concat(meta.providersPerReq);
    rawMeta.exports.forEach((exp, i) => {
      exp = this.resolveForwardRef([exp])[0];
      this.throwIfUndefined(exp, i);
      this.throwExportsIfNormalizedProvider(exp);
      if (reflector.getDecorators(exp)) {
        if (!baseMeta.exportsModules.includes(exp)) {
          baseMeta.exportsModules.push(exp);
        }
      } else if (isModuleWithParams(exp)) {
        const hasExportWithoutImport = !rawMeta.imports?.some((imp) => {
          if (isParamsWithModRefId(imp)) {
            return imp.modRefId === exp;
          } else if (isModuleWithParams(imp)) {
            return imp === exp;
          }
          return false;
        });

        if (hasExportWithoutImport) {
          this.throwExportWithParams(exp);
        }
        if (!baseMeta.exportsWithParams.includes(exp)) {
          baseMeta.exportsWithParams.push(exp);
        }
      } else if (isProvider(exp) || getTokens(providers).includes(exp)) {
        // Provider or token of provider
        this.exportProviders(exp, rawMeta, meta);
      } else {
        this.throwUnidentifiedToken(exp);
      }
    });
  }

  protected throwExportWithParams(moduleWithParams: ModuleWithParams) {
    const moduleName = getDebugClassName(moduleWithParams.module);
    const msg = `Exporting "${moduleName}" failed: "${moduleName}" is listed in "export" but missing from the "imports" array.`;
    throw new TypeError(msg);
  }

  protected throwUnidentifiedToken(token: any) {
    const tokenName = token.name || token;
    const msg =
      `Exporting "${tokenName}" failed: if "${tokenName}" is a token of a provider, this provider ` +
      'must be included in providersPerRou or providersPerReq.';
    throw new TypeError(msg);
  }

  protected throwExportsIfNormalizedProvider(provider: NormalizedProvider) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg = `Exporting "${providerName}" failed: in "exports" array must be includes tokens only.`;
      throw new TypeError(msg);
    }
  }

  protected exportProviders(token: any, rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    let found = false;
    (['Rou', 'Req'] as const).forEach((level) => {
      const unfilteredProviders = [...(rawMeta[`providersPer${level}`] || [])];
      let providers = unfilteredProviders.filter((p) => getToken(p) === token);
      providers = this.resolveForwardRef(providers);
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
      const msg =
        `Exporting failed: if "${providerName}" is a provider, it must be included ` +
        'in "providersPerRou" or "providersPerReq".';
      throw new Error(msg);
    }
  }

  protected throwIfUndefined(imp: unknown, i: number) {
    if (imp === undefined) {
      const msg =
        `Appends failed: element at appends[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".';
      throw new Error(msg);
    }
  }

  protected throwIfResolvingNormalizedProvider(meta: RestNormalizedMeta) {
    const resolvedCollisionsPerLevel: [any, ModuleType | ModuleWithParams][] = [];
    if (Array.isArray(meta.resolvedCollisionsPerRou)) {
      resolvedCollisionsPerLevel.push(...meta.resolvedCollisionsPerRou);
    }
    if (Array.isArray(meta.resolvedCollisionsPerReq)) {
      resolvedCollisionsPerLevel.push(...meta.resolvedCollisionsPerReq);
    }

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        const msg = `for ${providerName} inside "resolvedCollisionPer*" array must be includes tokens only.`;
        throw new TypeError(msg);
      }
    });
  }

  protected checkController(Controller: Class) {
    if (!reflector.getDecorators(Controller, isCtrlDecor)) {
      throw new Error(
        "Collecting controller's metadata failed: class " +
          `"${Controller.name}" does not have the "@controller()" decorator.`,
      );
    }
  }

  protected checkMetadata(baseMeta: NormalizedMeta, meta: RestNormalizedMeta) {
    this.checkGuards(meta.params.guards);
    this.throwIfResolvingNormalizedProvider(meta);
    meta.controllers.forEach((Controller) => this.checkController(Controller));
    const controllerDuplicates = getDuplicates(meta.controllers).map((c) => c.name);
    if (controllerDuplicates.length) {
      throw new CustomError({
        msg1: `Detected duplicate controllers - ${controllerDuplicates.join(', ')}`,
        level: 'fatal',
      });
    }

    if (
      isFeatureModule(baseMeta) &&
      !baseMeta.exportedProvidersPerMod.length &&
      !baseMeta.exportedMultiProvidersPerMod.length &&
      !baseMeta.exportsModules.length &&
      !baseMeta.providersPerApp.length &&
      !baseMeta.exportsWithParams.length &&
      !baseMeta.exportedExtensionsProviders.length &&
      !baseMeta.extensionsProviders.length &&
      !meta.exportedProvidersPerReq.length &&
      !meta.exportedProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerReq.length &&
      !meta.controllers.length &&
      !meta.appendsWithParams.length
    ) {
      const msg = 'this module should have "providersPerApp" or some controllers, or exports, or extensions.';
      throw new Error(msg);
    }
  }

  protected normalizeGuards(guards?: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }

  protected checkGuards(guards: NormalizedGuard[]) {
    for (const Guard of guards.map((n) => n.guard)) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        throw new TypeError(`Import with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`);
      }
    }
  }
}
