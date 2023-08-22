import { reflector, Class } from '../di';
import { ControllerMetadata1 } from '../types/controller-metadata';
import { DecoratorMetadata } from '../types/mix';
import { isController } from './type-guards';

export function transformControllersMetadata(controllers: Class[], moduleName: string) {
  const arrControllerMetadata: ControllerMetadata1[] = [];
  for (const controller of controllers) {
    const controllerMetadata1 = getControllerMetadata1(controller, moduleName);
    arrControllerMetadata.push(controllerMetadata1);
  }

  return arrControllerMetadata;
}

export function getControllerMetadata1(Controller: Class, moduleName: string) {
  const decoratorsAndValues = reflector.getClassMetadata(Controller);
  if (!decoratorsAndValues.find(isController)) {
    throw new Error(
      `Collecting controller's metadata in ${moduleName} failed: class ` +
        `"${Controller.name}" does not have the "@controller()" decorator.`
    );
  }
  const controllerMetadata: ControllerMetadata1 = { controller: Controller, decoratorsAndValues, properties: {} };
  const propertyMetadata = reflector.getPropMetadata(Controller);
  for (const propertyKey in propertyMetadata) {
    const [, ...methodDecorValues] = propertyMetadata[propertyKey];
    controllerMetadata.properties[propertyKey] = methodDecorValues.map<DecoratorMetadata>((decoratorPayload, i) => {
      const otherDecorators = methodDecorValues.slice();
      otherDecorators.splice(i, 1);
      return { ...decoratorPayload, otherDecorators };
    });
  }
  return controllerMetadata;
}
