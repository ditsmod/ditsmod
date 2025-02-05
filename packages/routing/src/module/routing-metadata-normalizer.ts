import { AnyObj, Class, isFeatureModule, objectKeys, Providers, reflector, resolveForwardRef } from '@ditsmod/core';

import { RoutingMetadata } from '#module/module-metadata.js';
import { RoutingNormalizedMeta } from '#types/routing-normalized-meta.js';
import { isAppendsWithParams, isCtrlDecor } from '#types/type.guards.js';
import { NormalizedGuard } from '#interceptors/guard.js';

export class RoutingMetadataNormalizer {
  normalize(rawMeta?: RoutingMetadata) {
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
    this.quickCheckMetadata(mergedMeta);
    meta.controllers.forEach((Controller) => this.checkController(Controller));

    return mergedMeta;
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

  protected quickCheckMetadata<T extends AnyObj>(meta: RoutingNormalizedMeta<T>) {
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
}
