import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { SQB_EXTENSIONS } from './types.js';
import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ group: SQB_EXTENSIONS, extension: SqbExtension, export: true }],
})
export class SqbModule {
  static withParams(): ModuleWithParams<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
