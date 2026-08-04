import type { ModRefId, NormalizedModuleMeta } from '@ditsmod/core';
import { getModule, MutableModuleManager } from '@ditsmod/core';

export class TestModuleManager extends MutableModuleManager {
  protected externalModules = new Set<ModRefId>();

  markModuleAsExternal(...modRefIds: ModRefId[]) {
    modRefIds.forEach((modRefId) => {
      const mod = getModule(modRefId);
      this.externalModules.add(mod);
    });
  }

  protected override normalizeMeta(modRefId: ModRefId): NormalizedModuleMeta {
    const normalizedModuleMeta = super.normalizeMeta(modRefId);
    const mod = getModule(modRefId);
    if (this.externalModules.has(mod)) {
      normalizedModuleMeta.isExternal = true;
    }
    return normalizedModuleMeta;
  }
}
