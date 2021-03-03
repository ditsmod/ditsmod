import { AnyObj } from '../types/any-obj';
import { ControllerType } from '../types/controller-type';
import { MethodMetadata } from './method-metadata';

export interface ControllerAndMethodMetadata<CV extends AnyObj = AnyObj, MV extends AnyObj = AnyObj> {
  controller: ControllerType;
  /**
   * Controller decorators values.
   */
  ctrlDecorValues: CV[];
  methods: {
    [methodName: string]: MethodMetadata<MV>[];
  };
}