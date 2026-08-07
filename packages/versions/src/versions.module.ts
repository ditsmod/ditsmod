import { featureModule, DynamicModule } from '@holu/core';
import { RestRouteExtension } from '@holu/rest';

import { VersionsExtension } from './versions.extension.js';

@featureModule({
  extensions: [{ extension: VersionsExtension, afterExtensions: [RestRouteExtension], export: true }],
})
export class VersionsModule {
  static withOpts(): DynamicModule<VersionsModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
