import { injectable, LogMediator } from '@ditsmod/core';

@injectable()
export class OpenapiLogMediator extends LogMediator {
  /**
   * return false, waiting for last module with ${className}.
   */
  dataAccumulation(self: object) {
    const className = self.constructor.name;
    this.setLog('trace', `${className}: return false, waiting for last module with ${className}.`);
  }
  /**
   * applying accumulated data from the entire application.
   */
  applyingAccumulatedData(self: object) {
    const className = self.constructor.name;
    this.setLog('trace', `${className}: applying accumulated data from the entire application.`);
  }
  /**
   * config file (XOasObject) for OpenAPI not found, applying default.
   */
   oasObjectNotFound(self: object) {
    const className = self.constructor.name;
    this.setLog('trace', `${className}: config file (with XOasObject type) not found, applying default.`);
  }
  /**
   * found config file (with XOasObject type), merge with default.
   */
   foundOasObject(self: object) {
    const className = self.constructor.name;
    this.setLog('trace', `${className}: found config file (with XOasObject type), merge with default.`);
  }
}
