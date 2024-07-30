import { InputLogLevel, Status } from '@ditsmod/core';
import { MulterOptions } from '@ts-stack/multer';

export class MulterExtendedOptions extends MulterOptions {
  /**
   * By default - `400` (BAD_REQUEST).
   */
  errorStatus?: Status = Status.BAD_REQUEST;
  /**
   * By default - `debug`.
   */
  errorLogLevel?: InputLogLevel = 'debug';
}
