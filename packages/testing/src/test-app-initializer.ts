import { AppInitializer, NormalizedModuleMetadata } from '@ditsmod/core';

export class TestAppInitializer extends AppInitializer {
  protected override prepareMeta(meta: NormalizedModuleMetadata) {
    return meta;
  }
}
