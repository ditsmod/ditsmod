import {
  AnyObj,
  Class,
  getModuleMetadata,
  getToken,
  getTokens,
  IModuleNormalizer,
  isFeatureModule,
  isModuleWithParams,
  isMultiProvider,
  isNormalizedProvider,
  isProvider,
  ModRefId,
  MultiProvider,
  NormalizedModuleMetadata,
  Provider,
  Providers,
  RawMeta,
  reflector,
  resolveForwardRef,
} from '@ditsmod/core';

import { RoutingRawMeta } from './module-metadata.js';
import { RoutingNormalizedModuleMetadata, RoutingRawProvidersMetadata } from '../types/routing-normalized-module-metadata.js';
import { isAppendsWithParams, isCtrlDecor } from '../types/type.guards.js';
import { GuardItem, NormalizedGuard } from '../interceptors/guard.js';
import { Level } from '../types/types.js';

type MergedNormalizedModuleMetadata<T extends AnyObj> = NormalizedModuleMetadata<T> &
  RoutingNormalizedModuleMetadata<T>;

export class RoutingModuleNormalizer implements IModuleNormalizer {
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  /**
   * Returns normalized module metadata.
   */
  normalize<T extends NormalizedModuleMetadata>(baseMeta: T) {
    const meta = new RoutingNormalizedModuleMetadata();
    const modName = (meta.name = baseMeta.name);
    const rawMeta = baseMeta.rawMeta as RoutingRawMeta;
    // if (isModuleWithParams(meta.modRefId) && meta.modRefId.guards.length) {
    //   meta.guardsPerMod.push(...this.normalizeGuards(rawMeta.guards));
    //   this.checkGuardsPerMod(meta.guardsPerMod, modName);
    // }

    rawMeta.appends?.forEach((ap, i) => {
      ap = resolveForwardRef(ap);
      this.throwIfUndefined(modName, 'Appends', ap, i);
      if (isAppendsWithParams(ap)) {
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsModules.push(ap);
      }
    });

    const providersTokens = getTokens([...(rawMeta.providersPerRou || []), ...(rawMeta.providersPerReq || [])]);

    const resolvedCollisionsPerLevel = [
      ...(rawMeta.resolvedCollisionsPerRou || []),
      ...(rawMeta.resolvedCollisionsPerReq || []),
    ];
    resolvedCollisionsPerLevel.forEach(([token]) => this.throwIfNormalizedProvider(modName, token));
    this.exportFromRawMeta(rawMeta, modName, providersTokens, meta);

    // @todo Refactor the logic with the `pickMeta()` call, as it may override previously set values in `meta`.
    this.pickMeta(meta, rawMeta);
    const mergedMeta = { ...baseMeta, ...meta };
    this.quickCheckMetadata(mergedMeta);
    meta.controllers.forEach((Controller) => this.checkController(modName, Controller));

    return mergedMeta;
  }

  protected checkController(modName: string, Controller: Class) {
    if (!reflector.getDecorators(Controller, isCtrlDecor)) {
      throw new Error(
        `Collecting controller's metadata in ${modName} failed: class ` +
          `"${Controller.name}" does not have the "@controller()" decorator.`,
      );
    }
  }

  protected pickMeta(targetObject: RoutingNormalizedModuleMetadata, ...sourceObjects: RawMeta[]) {
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

  protected exportFromRawMeta(
    rawMeta: { exports?: any[] } & RoutingRawProvidersMetadata,
    modName: string,
    providersTokens: any[],
    meta: RoutingNormalizedModuleMetadata,
  ) {
    rawMeta.exports?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(modName, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(modName, exp);
      if (isModuleWithParams(exp)) {
        // meta.exportsWithParams.push(exp);
        if (exp.exports?.length) {
          this.exportFromRawMeta(exp, modName, providersTokens, meta);
        }
      } else if (isProvider(exp) || providersTokens.includes(exp)) {
        this.findAndSetProviders(exp, rawMeta, meta);
      } else if (getModuleMetadata(exp)) {
        // meta.exportsModules.push(exp);
      } else {
        this.throwUnidentifiedToken(modName, exp);
      }
    });
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

  protected checkGuardsPerMod(guards: NormalizedGuard[], moduleName: string) {
    for (const Guard of guards.map((n) => n.guard)) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        throw new TypeError(
          `Import ${moduleName} with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`,
        );
      }
    }
  }

  protected quickCheckMetadata<T extends AnyObj>(meta: MergedNormalizedModuleMetadata<T>) {
    if (
      isFeatureModule(meta) &&
      !meta.exportedProvidersPerReq.length &&
      !meta.controllers.length &&
      !meta.exportedProvidersPerMod.length &&
      !meta.exportedProvidersPerRou.length &&
      !meta.exportsModules.length &&
      !meta.exportsWithParams.length &&
      !meta.exportedMultiProvidersPerMod.length &&
      !meta.exportedMultiProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerReq.length &&
      !meta.providersPerApp.length &&
      !meta.exportedExtensionsProviders.length &&
      !meta.extensionsProviders.length &&
      !meta.appendsWithParams.length
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

  protected findAndSetProviders(
    token: any,
    rawMeta: RoutingRawProvidersMetadata,
    meta: RoutingNormalizedModuleMetadata,
  ) {
    const levels = ['Rou', 'Req'] as Level[];
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
