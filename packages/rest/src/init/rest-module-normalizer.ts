import {
  Class,
  getToken,
  getTokens,
  isFeatureModule,
  isMultiProvider,
  isNormalizedProvider,
  isProvider,
  ModuleWithParams,
  MultiProvider,
  BaseMeta,
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
  ModRefId,
  getProxyForInitMeta,
  ForwardRefFn,
  ModuleType,
} from '@ditsmod/core';
import { ExportingUnknownSymbol, ForbiddenExportNormalizedProvider, UndefinedSymbol } from '@ditsmod/core/errors';

import { AppendsWithParams, RestInitRawMeta, RestModuleParams } from '#init/rest-init-raw-meta.js';
import { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { Level } from '#types/types.js';

/**
 * Normalizes and validates module metadata.
 */
export class RestModuleNormalizer {
  protected baseMeta: BaseMeta;
  protected meta: RestInitMeta;

  normalize(baseMeta: BaseMeta, rawMeta: RestInitRawMeta) {
    this.baseMeta = baseMeta;
    const meta = getProxyForInitMeta(baseMeta, RestInitMeta);
    this.meta = meta;
    this.normalizeDeclaredAndResolvedProviders(meta, rawMeta);
    this.normalizeExports(rawMeta, 'Exports');
    this.mergeModuleWithParams(baseMeta.modRefId, rawMeta, meta);
    this.appendModules(rawMeta, meta);
    this.checkMetadata(meta);
    return meta;
  }

  protected normalizeDeclaredAndResolvedProviders(meta: RestInitMeta, rawMeta: RestInitRawMeta) {
    if (rawMeta.controllers) {
      meta.controllers.push(...rawMeta.controllers);
    }
    (['Rou', 'Req'] satisfies Level[]).forEach((level) => {
      if (rawMeta[`providersPer${level}`]) {
        const providersPerLevel = this.resolveForwardRef(rawMeta[`providersPer${level}`]!);
        meta[`providersPer${level}`].push(...providersPerLevel);
      }

      if (rawMeta[`resolvedCollisionsPer${level}`]) {
        rawMeta[`resolvedCollisionsPer${level}`]!.forEach(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isModuleWithParams(module)) {
            module.module = resolveForwardRef(module.module);
          }
          meta[`resolvedCollisionsPer${level}`].push([token, module]);
        });
      }
    });

    return meta;
  }

  protected normalizeExports(rawMeta: RestInitRawMeta, action: 'Exports' | 'Exports with params') {
    if (!rawMeta.exports) {
      return;
    }
    const providers = this.meta.providersPerMod.concat(this.meta.providersPerRou, this.meta.providersPerReq);
    let tokens: any[] = [];
    if (providers.length) {
      tokens = getTokens(providers);
    }

    this.resolveForwardRef(rawMeta.exports).forEach((exp, i) => {
      if (exp === undefined) {
        throw new UndefinedSymbol(action, this.baseMeta.name, i);
      }
      if (isNormalizedProvider(exp)) {
        throw new ForbiddenExportNormalizedProvider(this.baseMeta.name, exp.token.name || exp.token);
      }
      if (reflector.getDecorators(exp, isFeatureModule)) {
        //
      } else if (isModuleWithParams(exp)) {
        if (!this.baseMeta.importsWithParams?.includes(exp)) {
          this.throwExportWithParams(exp);
        }
      } else if (isProvider(exp) || tokens.includes(exp)) {
        // Provider or token of provider
        this.exportProviders(exp);
      } else {
        throw new ExportingUnknownSymbol(this.baseMeta.name, exp.name || exp);
      }
    });
  }

  protected mergeModuleWithParams(modRefId: RestModRefId, rawMeta: RestInitRawMeta, meta: RestInitMeta): void {
    if (isAppendsWithParams(modRefId)) {
      if (modRefId.absolutePath !== undefined) {
        meta.params.absolutePath = modRefId.absolutePath;
      }
      if (modRefId.path !== undefined) {
        meta.params.path = modRefId.path;
      }
      meta.params.guards.push(...this.normalizeGuards(modRefId.guards));
      return;
    } else if (!isModuleWithParams(modRefId)) {
      return;
    }
    const params = modRefId.initParams?.get(initRest);

    if (params) {
      (
        [
          'providersPerApp',
          'providersPerMod',
          'providersPerRou',
          'providersPerReq',
        ] satisfies (keyof RestModuleParams)[]
      ).forEach((prop) => {
        if (params[prop] instanceof Providers || (Array.isArray(params[prop]) && params[prop].length)) {
          meta[prop].push(...this.resolveForwardRef(params[prop]));
        }
      });
      this.normalizeExports(params, 'Exports with params');

      if (params.absolutePath !== undefined) {
        meta.params.absolutePath = params.absolutePath;
      }
      if (params.path !== undefined) {
        meta.params.path = params.path;
      }
      meta.params.guards.push(...this.normalizeGuards(params.guards));
    }
  }

  protected appendModules(rawMeta: RestInitRawMeta, meta: RestInitMeta) {
    rawMeta.appends?.forEach((ap, i) => {
      ap = this.resolveForwardRef([ap])[0];
      if (isNormalizedProvider(ap)) {
        throw new ForbiddenExportNormalizedProvider(this.baseMeta.name, ap.token.name || ap.token);
      }
      if (isAppendsWithParams(ap)) {
        const params = { ...ap } as Partial<AppendsWithParams>;
        delete params.module;
        if (ap.initParams) {
          ap.initParams.set(initRest, params);
        } else {
          ap.initParams = new Map([[initRest, params]]);
        }
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsModules.push(ap);
      }
    });
  }

  protected resolveForwardRef<T extends RestModRefId | Provider | ForwardRefFn<ModuleType | Provider>>(
    arr: T[] | Providers,
  ) {
    return [...arr].map((item) => {
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
    }) as Exclude<T, ForwardRefFn>[];
  }

  protected throwExportWithParams(moduleWithParams: ModuleWithParams) {
    const moduleName = getDebugClassName(moduleWithParams.module);
    const msg = `Exporting "${moduleName}" failed: "${moduleName}" is listed in "export" but missing from the "imports" array.`;
    throw new TypeError(msg);
  }

  protected exportProviders(token: any) {
    let found = false;
    (['Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
      const providers = this.meta[`providersPer${level}`].filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          this.meta[`exportedMultiProvidersPer${level}`].push(...(providers as MultiProvider[]));
        } else {
          this.meta[`exportedProvidersPer${level}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      throw new ExportingUnknownSymbol(this.baseMeta.name, providerName);
    }
  }

  protected throwIfResolvingNormalizedProvider(meta: RestInitMeta) {
    const resolvedCollisionsPerLevel: [any, ModRefId][] = [];
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

  protected checkMetadata(meta: RestInitMeta) {
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
      isFeatureModule(this.baseMeta) &&
      !meta.exportedProvidersPerMod.length &&
      !meta.exportedMultiProvidersPerMod.length &&
      !meta.exportsModules.length &&
      !meta.providersPerApp.length &&
      !meta.exportsWithParams.length &&
      !meta.exportedExtensionsProviders.length &&
      !meta.extensionsProviders.length &&
      !meta.exportedProvidersPerReq.length &&
      !meta.exportedProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerReq.length &&
      !meta.controllers.length &&
      !meta.appendsWithParams.length
    ) {
      const msg = 'this module must have "providersPerApp" or some controllers, or exports, or extensions.';
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
