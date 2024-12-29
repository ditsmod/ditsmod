import { ChainError } from '@ts-stack/chain-error';

import { ErrorInfo } from './error-info.js';

export class CustomError extends ChainError {
  declare info: ErrorInfo;

  constructor(info: ErrorInfo, cause?: Error) {
    // Merge with default options
    info = new ErrorInfo(info);

    super(`${info.msg1}`, { info, cause, constructorOpt: info.constructorOpt, name: info.name }, true);
  }
}
