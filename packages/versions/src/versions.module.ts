import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { RoutesExtension } from '@ditsmod/routing';

import { VersionsExtension } from './versions.extension.js';

@featureModule({
  extensions: [
    { extension: VersionsExtension, afterExtensions: [RoutesExtension], export: true },
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
