import { CustomError, Status } from '@ditsmod/core';
import { MulterParsedForm, MulterError } from '@ts-stack/multer';

import { MulterExtendedOptions } from './multer-extended-options.js';

export async function checkResult<F extends object = any, G extends string = string>(
  promise: Promise<null | false | MulterParsedForm<F, G>>,
  options?: MulterExtendedOptions,
) {
  let result: null | false | MulterParsedForm<F, G>;
  try {
    result = await promise;
  } catch (err) {
    if (err instanceof MulterError) {
      const { level, status } = getErrorOptions(options);
      throw new CustomError({ msg1: err.message, msg2: err.code, level, status });
    } else {
      const status = (err as any).status || Status.BAD_REQUEST;
      throw new CustomError({ msg1: (err as any).message, status });
    }
  }
  if (result === null) {
    const msg1 = 'Multer failed to parse multipart/form-data: no body.';
    const { level } = getErrorOptions(options);
    throw new CustomError({ msg1, level, status: Status.LENGTH_REQUIRED });
  } else if (result === false) {
    const msg1 = 'Multer failed to parse multipart/form-data: no header with multipart/form-data content type.';
    const { level } = getErrorOptions(options);
    throw new CustomError({ msg1, level, status: Status.UNSUPPORTED_MEDIA_TYPE });
  }
  return result;
}

export function getErrorOptions(options?: MulterExtendedOptions) {
  const extendedOptions = new MulterExtendedOptions();
  const level = options?.errorLogLevel || extendedOptions.errorLogLevel!;
  const status = options?.errorStatus || extendedOptions.errorStatus!;
  return { level, status };
}
