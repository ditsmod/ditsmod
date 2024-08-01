import { injectable, methodFactory, optional } from '@ditsmod/core';
import { Multer } from '@ts-stack/multer';

import { MulterExtendedOptions } from './multer-extended-options.js';

@injectable()
export class MulterFactory {
  @methodFactory()
  getMulter(@optional() multerOptions?: MulterExtendedOptions) {
    return new Multer(multerOptions);
  }
}
