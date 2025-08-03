import { getModule, ModRefId, ModuleManager, BaseMeta, AllInitHooks } from '@ditsmod/core';

export class TestModuleManager extends ModuleManager {
  protected externalModules = new Set<ModRefId>();

  markModuleAsExternal(aModRefId: ModRefId[]) {
    aModRefId.forEach((modRefId) => {
      const mod = getModule(modRefId);
      this.externalModules.add(mod);
    });
  }

  protected override normalizeMetadata(modRefId: ModRefId, allInitHooks: AllInitHooks): BaseMeta {
    const meta = super.normalizeMetadata(modRefId, allInitHooks);
    const mod = getModule(modRefId);
    if (this.externalModules.has(mod)) {
      meta.isExternal = true;
    }
    return meta;
  }
}
