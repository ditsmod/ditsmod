import { LogMediator, MsgLogFilter } from '@ditsmod/core';

export class OpenapiLogMediator extends LogMediator {
  /**
   * return false, waiting for last module with ${className}.
   */
  dataAccumulation(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    this.setLog('trace', msgLogFilter, `${className}: return false, waiting for last module with ${className}.`);
  }
  /**
   * applying accumulated data from the entire application.
   */
  applyingAccumulatedData(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    this.setLog('trace', msgLogFilter, `${className}: applying accumulated data from the entire application.`);
  }
  /**
   * config file (XOasObject) for OpenAPI not found, applying default.
   */
   oasObjectNotFound(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    this.setLog('trace', msgLogFilter, `${className}: config file (with XOasObject type) not found, applying default.`);
  }
  /**
   * found config file (with XOasObject type), merge with default.
   */
   foundOasObject(self: object) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    this.setLog('trace', msgLogFilter, `${className}: found config file (with XOasObject type), merge with default.`);
  }
  /**
   * Settings OpenAPI parameters in ${moduleName} failed: parameter "${paramName}" not found in "${path}".
   */
  throwParamNotFoundInPath(controllerName: string, paramName: string, path: string) {
    const moduleName = this.moduleExtract.moduleName;
    const msg = `Settings OpenAPI parameters in ${moduleName} -> ${controllerName} failed: parameter "${paramName}" not found in "${path}".`;
    throw new Error(msg);
  }
}
