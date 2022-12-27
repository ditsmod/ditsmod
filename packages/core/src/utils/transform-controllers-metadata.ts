import { reflector, Type } from '@ts-stack/di';

import { ControllerMetadata1 } from '../types/controller-metadata';
import { DecoratorMetadata } from '../types/mix';
import { isController } from './type-guards';

export function transformControllersMetadata(controllers: Type<any>[], moduleName: string) {
  const arrControllerMetadata: ControllerMetadata1[] = [];
  for (const controller of controllers) {
    const controllerMetadata1 = getControllerMetadata1(controller, moduleName);
    arrControllerMetadata.push(controllerMetadata1);
  }

  return arrControllerMetadata;
}

export function getControllerMetadata1(Controller: Type<any>, moduleName: string) {
  const ctrlDecorValues = reflector.getClassMetadata(Controller);
  if (!ctrlDecorValues.find(isController)) {
    throw new Error(
      `Collecting controller's metadata in ${moduleName} failed: class ` +
        `"${Controller.name}" does not have the "@Controller()" decorator.`
    );
  }
  const controllerMetadata: ControllerMetadata1 = { controller: Controller, ctrlDecorValues, methods: {} };
  const propertyMetadata = reflector.getPropMetadata(Controller);
  for (const propertyKey in propertyMetadata) {
    const [, ...methodDecorValues] = propertyMetadata[propertyKey];
    controllerMetadata.methods[propertyKey] = methodDecorValues.map<DecoratorMetadata>((decoratorPayload, i) => {
      const otherDecorators = methodDecorValues.map(d => d.value);
      otherDecorators.splice(i, 1);
      return { otherDecorators, value: decoratorPayload.value, decoratorFactory: decoratorPayload.factory };
    });
  }
  return controllerMetadata;
}