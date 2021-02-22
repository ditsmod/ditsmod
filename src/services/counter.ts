import { Injectable } from '@ts-stack/di';

/**
 * Used to collect various statistics.
 */
@Injectable()
export class Counter {
  /**
   * During the application initialization, this ID increments with each decorator assigned to the
   * controller method.
   * 
   * Used to set the ID in the `ControllerMetadata.methods[methodName].id` and `RouteData`.
   */
  ctrlDecorLastId = 0;
}
