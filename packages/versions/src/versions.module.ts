import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { API_VERSIONS_EXTENSIONS } from './types.js';
import { VersionsExtension } from './versions.extension.js';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@featureModule({
  extensions: [
    { group: API_VERSIONS_EXTENSIONS, afterGroups: [ROUTES_EXTENSIONS], extension: VersionsExtension, export: true },
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
