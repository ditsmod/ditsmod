import { ControllerMetadata1 } from '#types/controller-metadata.js';
import { DecoratorMetadata } from '#types/mix.js';
import { reflector, Class } from '#di';

export function transformControllersMetadata(controllers: Class[]) {
  const aControllerMetadata: ControllerMetadata1[] = [];
  for (const controller of controllers) {
    const controllerMetadata1 = getControllerMetadata1(controller);
    aControllerMetadata.push(controllerMetadata1);
  }

  return aControllerMetadata;
}

export function getControllerMetadata1(Controller: Class) {
  const decoratorsAndValues = reflector.getMetadata(Controller).constructor?.decorators;
  const controllerMetadata: ControllerMetadata1 = { controller: Controller, decoratorsAndValues, properties: {} };
  const propertyMetadata = reflector.getMetadata(Controller);
  for (const propertyKey in propertyMetadata) {
    const methodDecorValues = propertyMetadata[propertyKey].decorators;
    controllerMetadata.properties[propertyKey] = methodDecorValues.map<DecoratorMetadata>((decoratorPayload, i) => {
      const otherDecorators = methodDecorValues.slice();
      otherDecorators.splice(i, 1);
      return { ...decoratorPayload, otherDecorators };
    });
  }
  return controllerMetadata;
}
