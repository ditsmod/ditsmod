import { AnyObj } from './any-obj';

export interface MethodMetadata<MV extends AnyObj = AnyObj> {
  /**
   * During application initialization, this ID increments with each controller method.
   */
  methodId: number;
  /**
   * This ID is unique per the application. During application initialization, it increments
   * with each decorator assigned to the controller method.
   */
  decoratorId: number;
  /**
   * Decorator value.
   */
  value: MV;
}
