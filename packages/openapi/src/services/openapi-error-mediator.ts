import { injectable } from '@ditsmod/core';

@injectable()
export class OpenapiErrorMediator {
  /**
   * Settings OpenAPI parameters in ${moduleName} failed: parameter "${paramName}" not found in "${path}".
   */
  throwParamNotFoundInPath(moduleName: string, controllerName: string, paramName: string, path: string) {
    const msg = `Settings OpenAPI parameters in ${moduleName} -> ${controllerName} failed: parameter "${paramName}" not found in "${path}".`;
    throw new Error(msg);
  }
}
