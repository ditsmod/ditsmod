import { AnyObj } from '../types/mix';
import { ControllerType } from '../types/mix';
import { DecoratorMetadata } from './mix';

export interface ControllerAndMethodMetadata<CV extends AnyObj = AnyObj, MV extends AnyObj = AnyObj> {
  controller: ControllerType;
  /**
   * Controller decorators values.
   */
  ctrlDecorValues: CV[];
  methods: {
    [methodName: string]: DecoratorMetadata<MV>[];
  };
}