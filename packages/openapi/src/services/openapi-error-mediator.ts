import { ErrorMediator, injectable } from '@ditsmod/core';

@injectable()
export class OpenapiErrorMediator extends ErrorMediator {
  /**
   * Settings OpenAPI parameters in ${moduleName} failed: parameter "${paramName}" not found in "${path}".
   */
  throwParamNotFoundInPath(controllerName: string, paramName: string, path: string) {
    const moduleName = this.moduleExtract.moduleName;
    const msg = `Settings OpenAPI parameters in ${moduleName} -> ${controllerName} failed: parameter "${paramName}" not found in "${path}".`;
    throw new Error(msg);
  }
}
