import {
  AnyObj,
  Class,
  getToken,
  getTokens,
  isFeatureModule,
  isMultiProvider,
  isNormalizedProvider,
  isProvider,
  mergeArrays,
  MetaAndImportsOrExports,
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
} from '@ditsmod/core';

import { RoutingMetadata, RoutingMetadataWithParams, RoutingModuleParams } from '#module/module-metadata.js';
import { RoutingNormalizedMeta } from '#types/routing-normalized-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';

/**
 * Normalizes and validates module metadata.
 */
export class RoutingMetadataNormalizer {
  normalize(baseMeta: NormalizedMeta, metaWithParams: RoutingMetadataWithParams): MetaAndImportsOrExports {
    const meta = new RoutingNormalizedMeta();
    metaWithParams.appends?.forEach((ap, i) => {
      ap = resolveForwardRef(ap);
      this.throwIfUndefined(ap, i);
      if (isAppendsWithParams(ap)) {
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsModules.push(ap);
      }
    });

    this.pickAndMergeMeta(meta, metaWithParams);
    const mergedMeta = { ...metaWithParams, ...meta };
    this.quickCheckMetadata(baseMeta, mergedMeta);
    meta.controllers.forEach((Controller) => this.checkController(Controller));
    this.normalizeModule(metaWithParams, meta);

    return { meta: mergedMeta, importsOrExports: meta.appendsModules.concat(meta.appendsWithParams as any[]) };
  }

  protected mergeModuleWithParams(modWitParams: ModuleWithParams, metadata: RoutingMetadata) {
    const metadata1 = Object.assign({}, metadata) as RoutingMetadataWithParams;
    objectKeys(modWitParams).forEach((p) => {
      // If here is object with [Symbol.iterator]() method, this transform it to an array.
      if (Array.isArray(modWitParams[p]) || modWitParams[p] instanceof Providers) {
        (metadata1 as any)[p] = mergeArrays((metadata1 as any)[p], modWitParams[p]);
      }
    });
    metadata1.path = (modWitParams as RoutingModuleParams).path;
    metadata1.absolutePath = (modWitParams as RoutingModuleParams).absolutePath;

    return metadata1;
  }

  protected normalizeModule(metaWithParams: RoutingMetadataWithParams, meta: RoutingNormalizedMeta) {
    this.throwIfResolvingNormalizedProvider(metaWithParams);
    this.exportFromReflectMetadata(metaWithParams, meta);
    this.pickAndMergeMeta(meta, metaWithParams);
    meta.guardsPerMod.push(...this.normalizeGuards(metaWithParams.guards));
    this.checkGuardsPerMod(meta.guardsPerMod);
  }

  protected throwIfResolvingNormalizedProvider(metaWithParams: RoutingMetadataWithParams) {
    const resolvedCollisionsPerLevel: [any, ModuleType | ModuleWithParams][] = [];
    if (Array.isArray(metaWithParams.resolvedCollisionsPerRou)) {
      resolvedCollisionsPerLevel.push(...metaWithParams.resolvedCollisionsPerRou);
    }
    if (Array.isArray(metaWithParams.resolvedCollisionsPerReq)) {
      resolvedCollisionsPerLevel.push(...metaWithParams.resolvedCollisionsPerReq);
    }

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        const msg = `for ${providerName} inside "resolvedCollisionPer*" array must be includes tokens only.`;
        throw new TypeError(msg);
      }
    });
  }

  protected exportFromReflectMetadata(metaWithParams: RoutingMetadataWithParams, meta: RoutingNormalizedMeta) {
    const providers: Provider[] = [];
    if (Array.isArray(metaWithParams.providersPerRou)) {
      providers.push(...metaWithParams.providersPerRou);
    }
    if (Array.isArray(metaWithParams.providersPerReq)) {
      providers.push(...metaWithParams.providersPerReq);
    }

    metaWithParams.exports?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(exp, i);
      this.throwExportsIfNormalizedProvider(exp);
      if (isProvider(exp) || getTokens(providers).includes(exp)) {
        this.findAndSetProviders(exp, metaWithParams, meta);
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

  protected findAndSetProviders(token: any, metaWithParams: RoutingMetadataWithParams, meta: RoutingNormalizedMeta) {
    let found = false;
    (['Rou', 'Req'] as const).forEach((level) => {
      const unfilteredProviders = [...(metaWithParams[`providersPer${level}`] || [])];
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

  protected pickAndMergeMeta(targetObject: RoutingNormalizedMeta, ...sourceObjects: RoutingMetadataWithParams[]) {
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

  protected checkController(Controller: Class) {
    if (!reflector.getDecorators(Controller, isCtrlDecor)) {
      throw new Error(
        "Collecting controller's metadata failed: class " +
          `"${Controller.name}" does not have the "@controller()" decorator.`,
      );
    }
  }

  protected quickCheckMetadata<T extends AnyObj>(baseMeta: NormalizedMeta, meta: RoutingNormalizedMeta<T>) {
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
