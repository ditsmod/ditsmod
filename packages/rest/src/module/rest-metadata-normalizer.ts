import {
  AnyObj,
  Class,
  ModuleWithParentMeta,
  getToken,
  getTokens,
  isFeatureModule,
  isModuleWithParentMeta,
  isModuleWithParams,
  isMultiProvider,
  isNormalizedProvider,
  isProvider,
  mergeArrays,
  ModuleType,
  ModuleWithParams,
  MultiProvider,
  NormalizedMeta,
  NormalizedProvider,
  objectKeys,
  Provider,
  Providers,
  reflector,
  resolveForwardRef,
  NormImportsWithParams,
} from '@ditsmod/core';

import { RestMetadata, RestModuleParams } from '#module/module-metadata.js';
import { RestNormalizedMeta } from '#types/rest-normalized-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';
import { restMetadata } from '#decorators/rest-metadata.js';

/**
 * Normalizes and validates module metadata.
 */
export class RestMetadataNormalizer {
  normalize(baseMeta: NormalizedMeta, rawMeta: RestMetadata) {
    const meta = new RestNormalizedMeta();
    this.mergeModuleWithParams(baseMeta, meta);
    rawMeta.appends?.forEach((ap, i) => {
      ap = resolveForwardRef(ap);
      this.throwIfUndefined(ap, i);
      if (isAppendsWithParams(ap)) {
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsModules.push(ap);
      }
    });
    this.setParentMeta(baseMeta, rawMeta);
    this.normalizeImportsWithParams(rawMeta, meta);
    this.pickAndMergeMeta(meta, rawMeta);
    const mergedMeta = { ...rawMeta, ...meta } as RestNormalizedMeta;
    this.quickCheckMetadata(baseMeta, mergedMeta);
    meta.controllers.forEach((Controller) => this.checkController(Controller));
    this.normalizeModule(rawMeta, meta);

    return mergedMeta;
  }

  protected mergeModuleWithParams(baseMeta: NormalizedMeta, meta: RestNormalizedMeta): void {
    const { modRefId } = baseMeta;
    if (isAppendsWithParams(modRefId)) {
      meta.guardsPerMod.push(...this.normalizeGuards(modRefId.guards));
      return;
    } else if (!isModuleWithParentMeta(modRefId)) {
      return;
    }
    const normDecorMeta = modRefId.parentMeta.normDecorMeta.get(restMetadata) as RestNormalizedMeta | undefined;
    const params = normDecorMeta?.importsWithParams.find((param) => param.modRefId === modRefId);

    if (params) {
      objectKeys(params).forEach((p) => {
        // If here is object with [Symbol.iterator]() method, this transform it to an array.
        if (Array.isArray((meta as any)[p]) && (Array.isArray(params[p]) || (params as any)[p] instanceof Providers)) {
          (meta as any)[p] = mergeArrays((meta as any)[p], (params as any)[p]);
        }
      });
      meta.guardsPerMod.push(...this.normalizeGuards(params.guards));
    }
  }

  protected normalizeModule(rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    this.throwIfResolvingNormalizedProvider(rawMeta);
    this.exportFromReflectMetadata(rawMeta, meta);
    this.pickAndMergeMeta(meta, rawMeta);
    this.checkGuardsPerMod(meta.guardsPerMod);
  }

  protected throwIfResolvingNormalizedProvider(rawMeta: RestMetadata) {
    const resolvedCollisionsPerLevel: [any, ModuleType | ModuleWithParams][] = [];
    if (Array.isArray(rawMeta.resolvedCollisionsPerRou)) {
      resolvedCollisionsPerLevel.push(...rawMeta.resolvedCollisionsPerRou);
    }
    if (Array.isArray(rawMeta.resolvedCollisionsPerReq)) {
      resolvedCollisionsPerLevel.push(...rawMeta.resolvedCollisionsPerReq);
    }

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        const msg = `for ${providerName} inside "resolvedCollisionPer*" array must be includes tokens only.`;
        throw new TypeError(msg);
      }
    });
  }

  protected exportFromReflectMetadata(rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    const providers: Provider[] = [];
    if (Array.isArray(rawMeta.providersPerRou)) {
      providers.push(...rawMeta.providersPerRou);
    }
    if (Array.isArray(rawMeta.providersPerReq)) {
      providers.push(...rawMeta.providersPerReq);
    }

    rawMeta.exports?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(exp, i);
      this.throwExportsIfNormalizedProvider(exp);
      if (isProvider(exp) || getTokens(providers).includes(exp)) {
        this.findAndSetProviders(exp, rawMeta, meta);
      } else {
        this.throwUnidentifiedToken(exp);
      }
    });
  }

  protected throwUnidentifiedToken(token: any) {
    const tokenName = token.name || token;
    const msg =
      `Exporting "${tokenName}" failed: if "${tokenName}" is a token of a provider, this provider ` +
      'must be included in providersPerRou or providersPerReq. ' +
      `If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`;
    throw new TypeError(msg);
  }

  protected throwExportsIfNormalizedProvider(provider: NormalizedProvider) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg = `Exporting "${providerName}" failed: in "exports" array must be includes tokens only.`;
      throw new TypeError(msg);
    }
  }

  protected findAndSetProviders(token: any, rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    let found = false;
    (['Rou', 'Req'] as const).forEach((level) => {
      const unfilteredProviders = [...(rawMeta[`providersPer${level}`] || [])];
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
      const msg =
        `Exporting failed: if "${providerName}" is a provider, it must be included ` +
        'in "providersPerRou" or "providersPerReq".';
      throw new Error(msg);
    }
  }

  protected pickAndMergeMeta(targetObject: RestNormalizedMeta, ...sourceObjects: RestMetadata[]) {
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

  protected throwIfUndefined(imp: unknown, i: number) {
    if (imp === undefined) {
      const msg =
        `Appends failed: element at appends[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".';
      throw new Error(msg);
    }
  }

  protected setParentMeta(baseMeta: NormalizedMeta, rawMeta: RestMetadata) {
    rawMeta.importsWithParams?.forEach((param) => {
      (param.modRefId as ModuleWithParentMeta).parentMeta ??= baseMeta;
    });
  }

  protected normalizeImportsWithParams(rawMeta: RestMetadata, meta: RestNormalizedMeta) {
    meta.importsWithParams = (rawMeta.importsWithParams || []).map((params) => {
      if (isModuleWithParams(params.modRefId)) {
        return params;
      }
      params.modRefId = { module: params.modRefId } as ModuleWithParams;
      return params;
    }) as NormImportsWithParams<RestModuleParams>[];
  }

  protected checkController(Controller: Class) {
    if (!reflector.getDecorators(Controller, isCtrlDecor)) {
      throw new Error(
        "Collecting controller's metadata failed: class " +
          `"${Controller.name}" does not have the "@controller()" decorator.`,
      );
    }
  }

  protected quickCheckMetadata(baseMeta: NormalizedMeta, meta: RestNormalizedMeta) {
    if (
      isFeatureModule(meta) &&
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

  protected checkGuardsPerMod(guards: NormalizedGuard[]) {
    for (const Guard of guards.map((n) => n.guard)) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        throw new TypeError(`Import with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`);
      }
    }
  }
}
