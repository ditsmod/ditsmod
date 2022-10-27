import { Module, ModuleWithParams } from '@ditsmod/core';

import { API_VERSIONS_EXTENSIONS } from './types';
import { VersionsExtension } from './versions.extension';

@Module({
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
