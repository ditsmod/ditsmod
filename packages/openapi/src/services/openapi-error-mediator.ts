import { CustomError } from '@ditsmod/core';

export const openapiErrors = {
  /**
   * Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".
   */
  throwParamNotFoundInPath(controllerName: string, paramName: string, path: string) {
    return new CustomError({
      code: openapiErrors.throwParamNotFoundInPath.name,
      msg1: `Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".`,
      level: 'warn',
    });
  },
};
