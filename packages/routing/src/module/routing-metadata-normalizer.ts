import {
  AnyObj,
  Class,
  getToken,
  getTokens,
  isFeatureModule,
  isMultiProvider,
  isNormalizedProvider,
  isProvider,
  MetaAndImportsOrExports,
  ModuleType,
  MultiProvider,
  NormalizedMeta,
  NormalizedProvider,
  objectKeys,
  Provider,
  Providers,
  reflector,
  resolveForwardRef,
} from '@ditsmod/core';

import { RoutingMetadata, RoutingModuleParams } from '#module/module-metadata.js';
import { RoutingNormalizedMeta } from '#types/routing-normalized-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';

export class RoutingMetadataNormalizer {
  normalize(baseMeta: NormalizedMeta, rawMeta?: RoutingMetadata): MetaAndImportsOrExports {
    rawMeta = Object.assign({}, rawMeta);
    objectKeys(rawMeta).forEach((p) => {
      if (rawMeta[p] instanceof Providers) {
        (rawMeta as any)[p] = [...rawMeta[p]];
      } else if (Array.isArray(rawMeta[p])) {
        (rawMeta as any)[p] = rawMeta[p].slice();
      }
    });

    const meta = new RoutingNormalizedMeta();
    rawMeta.appends?.forEach((ap, i) => {
      ap = resolveForwardRef(ap);
      this.throwIfUndefined(ap, i);
      if (isAppendsWithParams(ap)) {
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsModules.push(ap);
      }
    });

    this.pickAndMergeMeta(meta, rawMeta);
    const mergedMeta = { ...rawMeta, ...meta };
    this.quickCheckMetadata(baseMeta, mergedMeta);
    meta.controllers.forEach((Controller) => this.checkController(Controller));
    this.normalizeModule(rawMeta, meta);

    return { meta: mergedMeta, importsOrExports: meta.appendsModules.concat(meta.appendsWithParams as any[]) };
  }

  protected normalizeModule(rawMeta: RoutingMetadata, meta: RoutingNormalizedMeta) {
    this.throwIfResolvingNormalizedProvider(rawMeta);
    this.exportFromReflectMetadata(rawMeta, meta);
    this.pickAndMergeMeta(meta, rawMeta);
  }

  protected throwIfResolvingNormalizedProvider(rawMeta: RoutingMetadata) {
    const resolvedCollisionsPerLevel: [any, ModuleType | RoutingModuleParams][] = [];
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

  protected exportFromReflectMetadata(rawMeta: RoutingMetadata, meta: RoutingNormalizedMeta) {
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

  protected findAndSetProviders(token: any, rawMeta: RoutingMetadata, meta: RoutingNormalizedMeta) {
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

  protected pickAndMergeMeta(targetObject: RoutingNormalizedMeta, ...sourceObjects: RoutingMetadata[]) {
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
}
