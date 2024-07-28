import { injectable, methodFactory, optional } from '@ditsmod/core';
import { Multer, MulterOptions } from '@ts-stack/multer';

@injectable()
export class MulterFactory {
  @methodFactory()
  getMulter(@optional() multerOptions?: MulterOptions) {
    return new Multer(multerOptions);
  }
}
