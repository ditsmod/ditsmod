import { featureModule, DynamicModule } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

import { VersionsExtension } from './versions.extension.js';

@featureModule({
  extensions: [{ extension: VersionsExtension, afterExtensions: [RestRouteExtension], export: true }],
})
export class VersionsModule {
  static withParams(): DynamicModule<VersionsModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
