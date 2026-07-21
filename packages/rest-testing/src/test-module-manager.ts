import type { ModRefId, NormalizedModuleMeta, AllInitHooks } from '@ditsmod/core';
import { getModule, ModuleManager } from '@ditsmod/core';

export class TestModuleManager extends ModuleManager {
  protected externalModules = new Set<ModRefId>();

  markModuleAsExternal(...modRefIds: ModRefId[]) {
    modRefIds.forEach((modRefId) => {
      const mod = getModule(modRefId);
      this.externalModules.add(mod);
    });
  }

  protected override normalizeMeta(modRefId: ModRefId, allInitHooks: AllInitHooks): NormalizedModuleMeta {
    const normalizedModuleMeta = super.normalizeMeta(modRefId, allInitHooks);
    const mod = getModule(modRefId);
    if (this.externalModules.has(mod)) {
      normalizedModuleMeta.isExternal = true;
    }
    return normalizedModuleMeta;
  }
}
