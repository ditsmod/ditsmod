import { ModRefId, ModuleManager, NormalizedModuleMetadata, Provider } from '@ditsmod/core';

export class TestModuleManager extends ModuleManager {
  protected override normalizeMetadata(modRefId: ModRefId): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(modRefId);
    return meta;
  }
}
