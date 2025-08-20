import { ChainError } from '@ts-stack/chain-error';

import { ErrorInfo } from './error-info.js';

export class CustomError extends ChainError {
  declare info: ErrorInfo;
  code?: string;

  constructor(info: ErrorInfo, cause?: Error) {
    // Merge with default options
    info = new ErrorInfo(info);
    let fnName = info.name || new.target.name;
    if (fnName == 'CustomError' && info.code) {
      fnName = `ERR_${info.code}`;
    } else if (info.code) {
      fnName = `${fnName}_${info.code}`;
    }
    super(`${info.msg1}`, { info, cause, constructorOpt: info.constructorOpt, name: fnName }, info.skipCauseMessage);
    this.code = info.code || new.target.name;
  }
}
