import { getModule, ModRefId, ModuleManager, NormalizedMeta } from '@ditsmod/core';

export class TestModuleManager extends ModuleManager {
  protected externalModules = new Set<ModRefId>();

  markModuleAsExternal(aModRefId: ModRefId[]) {
    aModRefId.forEach((modRefId) => {
      const mod = getModule(modRefId);
      this.externalModules.add(mod);
    });
  }

  protected override normalizeMetadata(modRefId: ModRefId): NormalizedMeta {
    const meta = super.normalizeMetadata(modRefId);
    const mod = getModule(modRefId);
    if (this.externalModules.has(mod)) {
      meta.isExternal = true;
    }
    return meta;
  }
}
