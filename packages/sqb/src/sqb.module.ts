import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { SQB_EXTENSIONS } from './types';
import { SqbExtension } from './sqb.extension';

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
