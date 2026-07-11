import type { Class, NormalizedModuleMeta } from '@ditsmod/core';
import { isFeatureModule, Reflector, getDuplicates, getProxyForInitMeta } from '@ditsmod/core';
import { EmptyModuleMetadata } from '@ditsmod/core/errors';

import type { TrpcInitDecoratorOptions } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import { ControllerDoesNotHaveDecorator, DuplicateOfControllers, InvalidGuard } from '../error/trpc-errors.js';
import type { NormalizedGuard } from '#interceptors/trpc-guard.js';
import { GuardItem } from '#interceptors/trpc-guard.js';
import { isControllerDecorator } from '#types/type.guards.js';

/**
 * Normalizes and validates module metadata.
 */
export class TrpcModuleNormalizer {
  protected normalizedModuleMeta: NormalizedModuleMeta;
  protected meta: TrpcInitMeta;

  normalize(normalizedModuleMeta: NormalizedModuleMeta, decoratorOptions: TrpcInitDecoratorOptions) {
    this.normalizedModuleMeta = normalizedModuleMeta;
    const meta = getProxyForInitMeta(normalizedModuleMeta, TrpcInitMeta);
    this.meta = meta;
    if (decoratorOptions.controllers) {
      this.meta.controllers.push(...decoratorOptions.controllers);
    }
    this.checkMetadata();
    return meta;
  }

  protected checkMetadata() {
    const meta = this.meta;
    this.checkGuards(meta.params.guards);
    meta.controllers.forEach((Controller) => this.checkController(Controller));
    const controllerDuplicates = getDuplicates(meta.controllers).map((c) => c.name);
    if (controllerDuplicates.length) {
      throw new DuplicateOfControllers(controllerDuplicates.join(', '));
    }

    if (
      isFeatureModule(this.normalizedModuleMeta) &&
      !meta.exportedProvidersPerMod.length &&
      !meta.exportedMultiProvidersPerMod.length &&
      !meta.exportsModules.length &&
      !meta.providersPerApp.length &&
      !meta.exportsWithParams.length &&
      !meta.exportedExtensionProviders.length &&
      !meta.extensionProviders.length &&
      !meta.exportedProvidersPerReq.length &&
      !meta.exportedProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerReq.length &&
      !meta.controllers.length
    ) {
      throw new EmptyModuleMetadata();
    }
  }

  protected checkController(Controller: Class) {
    if (!Reflector.getClassLevelMeta(Controller, isControllerDecorator)) {
      throw new ControllerDoesNotHaveDecorator(Controller.name);
    }
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
