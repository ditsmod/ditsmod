import { AnyObj } from '../types/any-obj';
import { ControllerType } from '../types/controller-type';
import { DecoratorMetadata } from './decorator-metadata';

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