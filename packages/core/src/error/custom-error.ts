import { ChainError } from '@ts-stack/chain-error';

import { ErrorInfo } from './error-info.js';
import { AnyFn, OmitProps } from '#types/mix.js';

export class CustomError extends ChainError {
  declare info: ErrorInfo;

  constructor(info: ErrorInfo, cause?: Error) {
    // Merge with default options
    info = new ErrorInfo(info);

    super(
      `${info.msg1}`,
      { info, cause, constructorOpt: info.constructorOpt, name: info.name || new.target.constructor.name },
      info.skipCauseMessage,
    );
  }
}

/**
 * Used to create an instance of {@link CustomError} for system messages.
 *
 * @param fnAsErrCode The function whose name will be used as the error code and,
 * if no corresponding option is specified, as {@link ErrorInfo.constructorOpt}.
 */
export function newCustomError(fnAsErrCode: AnyFn, info: OmitProps<ErrorInfo, 'code'>, cause?: Error) {
  (info as ErrorInfo).code = fnAsErrCode.name;
  info.constructorOpt ??= fnAsErrCode;
  return new CustomError(info, cause);
}
