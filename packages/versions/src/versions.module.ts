import { mod, ModuleWithParams } from '@ditsmod/core';

import { API_VERSIONS_EXTENSIONS } from './types';
import { VersionsExtension } from './versions.extension';

@mod({
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
