import { CustomError, injectable } from '@ditsmod/core';

@injectable()
export class OpenapiErrorMediator {
  /**
   * Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".
   */
  static throwParamNotFoundInPath(controllerName: string, paramName: string, path: string) {
    return new CustomError({
      code: OpenapiErrorMediator.throwParamNotFoundInPath.name,
      msg1: `Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".`,
      level: 'warn',
    });
  }
}
