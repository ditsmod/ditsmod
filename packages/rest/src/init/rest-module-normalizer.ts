import {
  Class,
  isFeatureModule,
  isNormalizedProvider,
  BaseMeta,
  Providers,
  reflector,
  resolveForwardRef,
  getDuplicates,
  isModuleWithParams,
  Provider,
  isClassProvider,
  isTokenProvider,
  getProxyForInitMeta,
  ForwardRefFn,
  ModuleType,
} from '@ditsmod/core';
import { ForbiddenExportNormalizedProvider, ModuleShouldHaveValue } from '@ditsmod/core/errors';

import { AppendsWithParams, RestInitRawMeta } from '#init/rest-init-raw-meta.js';
import { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';
import { restModule } from '#decorators/rest-init-hooks-and-metadata.js';
import { ControllerDoesNotHaveDecorator, DuplicateOfControllers, InvalidGuard } from '#errors';

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
    if (rawMeta.controllers) {
      this.meta.controllers.push(...rawMeta.controllers);
    }
    this.mergeModuleWithParams(baseMeta.modRefId);
    this.appendModules(rawMeta);
    this.checkMetadata();
    return meta;
  }

  protected mergeModuleWithParams(modRefId: RestModRefId): void {
    if (isAppendsWithParams(modRefId)) {
      if (modRefId.absolutePath !== undefined) {
        this.meta.params.absolutePath = modRefId.absolutePath;
      }
      if (modRefId.path !== undefined) {
        this.meta.params.path = modRefId.path;
      }
      this.meta.params.guards.push(...this.normalizeGuards(modRefId.guards));
      return;
    } else if (!isModuleWithParams(modRefId)) {
      return;
    }
    const params = modRefId.initParams?.get(restModule);

    if (params) {
      if (params.absolutePath !== undefined) {
        this.meta.params.absolutePath = params.absolutePath;
      }
      if (params.path !== undefined) {
        this.meta.params.path = params.path;
      }
      this.meta.params.guards.push(...this.normalizeGuards(params.guards));
    }
  }

  protected appendModules(rawMeta: RestInitRawMeta) {
    rawMeta.appends?.forEach((ap, i) => {
      ap = this.resolveForwardRef([ap])[0];
      if (isNormalizedProvider(ap)) {
        throw new ForbiddenExportNormalizedProvider(this.baseMeta.name, ap.token.name || ap.token);
      }
      if (isAppendsWithParams(ap)) {
        const params = { ...ap } as Partial<AppendsWithParams>;
        delete params.module;
        if (ap.initParams) {
          ap.initParams.set(restModule, params);
        } else {
          ap.initParams = new Map([[restModule, params]]);
        }
        this.meta.appendsWithParams.push(ap);
      } else {
        this.meta.appendsModules.push(ap);
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

  protected checkController(Controller: Class) {
    if (!reflector.getDecorators(Controller, isCtrlDecor)) {
      throw new ControllerDoesNotHaveDecorator(Controller.name);
    }
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
