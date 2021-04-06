import { AnyObj, ControllerType, DecoratorMetadata } from './mix';

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