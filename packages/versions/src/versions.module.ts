import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

import { VersionsExtension } from './versions.extension.js';

@featureModule({
  extensions: [
    { extension: VersionsExtension, afterExtensions: [RestRouteExtension], export: true },
  ],
})
export class VersionsModule {
  static withParams(): ModuleWithParams<VersionsModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
