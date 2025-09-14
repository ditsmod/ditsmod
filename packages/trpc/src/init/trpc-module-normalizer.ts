import {
  Class,
  isFeatureModule,
  isNormalizedProvider,
  BaseMeta,
  reflector,
  getDuplicates,
  ModRefId,
  getProxyForInitMeta,
  AnyObj,
  DecoratorAndValue,
} from '@ditsmod/core';
import { ModuleShouldHaveValue, ResolvedCollisionTokensOnly } from '@ditsmod/core/errors';

import { TrpcInitMeta, TrpcInitRawMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import { trpcController, ControllerRawMetadata } from '#decorators/trpc-controller.js';
import { ControllerDoesNotHaveDecorator, DuplicateOfControllers, InvalidGuard } from '../error/trpc-errors.js';
import { GuardItem, NormalizedGuard } from '#interceptors/trpc-guard.js';

export type Level = 'Req' | 'Rou' | 'Mod';

export function isCtrlDecor(decoratorAndValue?: AnyObj): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === trpcController;
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
    this.checkMetadata();
    return meta;
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
