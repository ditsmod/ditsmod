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
  isModuleWithParams,
  getDebugClassName,
  Provider,
  isClassProvider,
  isTokenProvider,
  ModRefId,
  getProxyForInitMeta,
  ForwardRefFn,
  ModuleType,
  AnyObj,
  DecoratorAndValue,
} from '@ditsmod/core';
import {
  ExportingUnknownSymbol,
  ForbiddenExportNormalizedProvider,
  ModuleShouldHaveValue,
  ReexportFailed,
  ResolvedCollisionTokensOnly,
  UndefinedSymbol,
} from '@ditsmod/core/errors';

import {
  TrpcInitMeta,
  TrpcInitRawMeta,
  initTrpcModule,
  TrpcModuleParams,
  TrpcModRefId,
} from '#decorators/trpc-init-hooks-and-metadata.js';
import { controller, ControllerRawMetadata } from '#decorators/controller.js';
import { ControllerDoesNotHaveDecorator, DuplicateOfControllers, InvalidGuard } from '../error/trpc-errors.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';

export type Level = 'Req' | 'Rou' | 'Mod';

export function isCtrlDecor(decoratorAndValue?: AnyObj): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === controller;
}

/**
 * Normalizes and validates module metadata.
 */
export class TrpcModuleNormalizer {
  protected baseMeta: BaseMeta;
  protected meta: TrpcInitMeta;

  normalize(baseMeta: BaseMeta, rawMeta: TrpcInitRawMeta) {
    this.baseMeta = baseMeta;
    const meta = getProxyForInitMeta(baseMeta, TrpcInitMeta);
    this.meta = meta;
    this.normalizeDeclaredAndResolvedProviders(rawMeta);
    this.normalizeExports(rawMeta, 'Exports');
    this.mergeModuleWithParams(baseMeta.modRefId);
    this.checkMetadata();
    return meta;
  }

  protected normalizeDeclaredAndResolvedProviders(rawMeta: TrpcInitRawMeta) {
    if (rawMeta.controllers) {
      this.meta.controllers.push(...rawMeta.controllers);
    }
    (['Rou', 'Req'] satisfies Level[]).forEach((level) => {
      if (rawMeta[`providersPer${level}`]) {
        const providersPerLevel = this.resolveForwardRef(rawMeta[`providersPer${level}`]!);
        this.meta[`providersPer${level}`].push(...providersPerLevel);
      }

      if (rawMeta[`resolvedCollisionsPer${level}`]) {
        rawMeta[`resolvedCollisionsPer${level}`]!.forEach(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isModuleWithParams(module)) {
            module.module = resolveForwardRef(module.module);
          }
          this.meta[`resolvedCollisionsPer${level}`].push([token, module]);
        });
      }
    });
  }

  protected normalizeExports(rawMeta: TrpcInitRawMeta, action: 'Exports' | 'Exports with params') {
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

  protected mergeModuleWithParams(modRefId: TrpcModRefId): void {
    if (!isModuleWithParams(modRefId)) {
      return;
    }
    const params = modRefId.initParams?.get(initTrpcModule);

    if (params) {
      (
        [
          'providersPerApp',
          'providersPerMod',
          'providersPerRou',
          'providersPerReq',
        ] satisfies (keyof TrpcModuleParams)[]
      ).forEach((prop) => {
        if (params[prop] instanceof Providers || (Array.isArray(params[prop]) && params[prop].length)) {
          this.meta[prop].push(...this.resolveForwardRef(params[prop]));
        }
      });
      this.normalizeExports(params, 'Exports with params');
      // this.meta.params.guards.push(...this.normalizeGuards(params.guards));
    }
  }

  protected resolveForwardRef<T extends TrpcModRefId | Provider | ForwardRefFn<ModuleType | Provider>>(
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
    const importedModuleName = getDebugClassName(moduleWithParams.module) || '""';
    throw new ReexportFailed(this.baseMeta.name, importedModuleName);
  }

  protected throwIfResolvingNormalizedProvider(meta: TrpcInitMeta) {
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
        throw new ResolvedCollisionTokensOnly(this.baseMeta.name, providerName);
      }
    });
  }

  protected checkController(Controller: Class) {
    if (!reflector.getDecorators(Controller, isCtrlDecor)) {
      throw new ControllerDoesNotHaveDecorator(Controller.name);
    }
  }

  protected checkMetadata() {
    const meta = this.meta;
    // this.checkGuards(meta.params.guards);
    this.throwIfResolvingNormalizedProvider(meta);
    meta.controllers.forEach((Controller) => this.checkController(Controller));
    const controllerDuplicates = getDuplicates(meta.controllers).map((c) => c.name);
    if (controllerDuplicates.length) {
      throw new DuplicateOfControllers(controllerDuplicates.join(', '));
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
      !meta.controllers.length
    ) {
      throw new ModuleShouldHaveValue();
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
        throw new InvalidGuard(type);
      }
    }
  }
}
