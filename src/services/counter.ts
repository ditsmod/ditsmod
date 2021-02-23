import { Injectable } from '@ts-stack/di';

/**
 * Used to collect various statistics.
 */
@Injectable()
export class Counter {
  #ctrlMethodLastId = 0;
  #ctrlDecoratorLastId = 0;

  /**
   * During the application initialization, this ID increments with each controller method.
   * 
   * Used to set the ID in the `ControllerMetadata.methods[methodName].methodId` and
   * `PreRouteData.methodId`.
   */
  getCtrlMethodLastId() {
    return this.#ctrlMethodLastId;
  }

  /**
   * During the application initialization, this ID increments with each decorator assigned to the
   * controller method.
   * 
   * Used to set the ID in the `ControllerMetadata.methods[methodName].decoratorId` and
   * `PreRouteData.decoratorId`.
   */
  getCtrlDecoratorLastId() {
    return this.#ctrlDecoratorLastId;
  }

  incrementCtrlMethodId() {
    return ++this.#ctrlMethodLastId;
  }

  incrementCtrlDecoratorId() {
    return ++this.#ctrlDecoratorLastId;
  }
}
