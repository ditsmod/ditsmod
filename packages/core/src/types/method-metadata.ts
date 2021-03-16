import { AnyObj } from './any-obj';

export interface MethodMetadata<MV extends AnyObj = AnyObj> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: MV;
}
