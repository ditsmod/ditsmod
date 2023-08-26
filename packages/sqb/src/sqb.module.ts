import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { SQB_EXTENSIONS } from './types.js';
import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ groupToken: SQB_EXTENSIONS, extension: SqbExtension, exported: true }],
})
export class SqbModule {
  static withParams(): ModuleWithParams<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
