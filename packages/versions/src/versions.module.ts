import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { RouteExtension } from '@ditsmod/rest';

import { VersionsExtension } from './versions.extension.js';

@featureModule({
  extensions: [
    { extension: VersionsExtension, afterExtensions: [RouteExtension], export: true },
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
