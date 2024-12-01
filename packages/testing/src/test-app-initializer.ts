import { AppInitializer, NormalizedModuleMetadata } from '@ditsmod/core';

export class TestAppInitializer extends AppInitializer {
  protected override prepareMetadataPerMod1(meta: NormalizedModuleMetadata) {
    return meta;
  }
}
