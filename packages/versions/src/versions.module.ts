import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { API_VERSIONS_EXTENSIONS } from './types.js';
import { VersionsExtension } from './versions.extension.js';

@featureModule({
  extensions: [{ groupToken: API_VERSIONS_EXTENSIONS, extension: VersionsExtension, exported: true }],
})
export class VersionsModule {
  static withParams(): ModuleWithParams<VersionsModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
