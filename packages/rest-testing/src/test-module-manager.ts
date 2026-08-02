import type { ModRefId, NormalizedModuleMeta, AllModuleMixins } from '@ditsmod/core';
import { getModule, MutableModuleManager } from '@ditsmod/core';

export class TestModuleManager extends MutableModuleManager {
  protected externalModules = new Set<ModRefId>();

  markModuleAsExternal(...modRefIds: ModRefId[]) {
    modRefIds.forEach((modRefId) => {
      const mod = getModule(modRefId);
      this.externalModules.add(mod);
    });
  }

  protected override normalizeMeta(modRefId: ModRefId, allModuleMixinsMap: AllModuleMixins): NormalizedModuleMeta {
    const normalizedModuleMeta = super.normalizeMeta(modRefId, allModuleMixinsMap);
    const mod = getModule(modRefId);
    if (this.externalModules.has(mod)) {
      normalizedModuleMeta.isExternal = true;
    }
    return normalizedModuleMeta;
  }
}
