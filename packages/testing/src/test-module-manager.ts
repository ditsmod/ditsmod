import { ModRefId, ModuleManager, NormalizedModuleMetadata } from '@ditsmod/core';

export class TestModuleManager extends ModuleManager {
  protected externalModules = new Set<ModRefId>();

  markModuleAsExternal(aModRefId: ModRefId[]) {
    aModRefId.forEach((modRefId) => this.externalModules.add(modRefId));
  }

  protected override normalizeMetadata(modRefId: ModRefId): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(modRefId);
    if (this.externalModules.has(meta.modRefId)) {
      meta.isExternal = true;
    }
    return meta;
  }
}
