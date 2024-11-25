import { injectable, factoryMethod, optional } from '@ditsmod/core';
import { Multer } from '@ts-stack/multer';

import { MulterExtendedOptions } from './multer-extended-options.js';

@injectable()
export class MulterFactory {
  @factoryMethod()
  getMulter(@optional() multerOptions?: MulterExtendedOptions) {
    return new Multer(multerOptions);
  }
}
