import { AnyObj } from './mix';

export interface DecoratorMetadata<MV extends AnyObj = AnyObj> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: MV;
}
