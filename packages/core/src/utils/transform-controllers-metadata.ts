import { ControllerMetadata1 } from '#types/controller-metadata.js';
import { DecoratorMetadata } from '#types/mix.js';
import { reflector, Class } from '#di';
import { isController } from './type-guards.js';

export function transformControllersMetadata(controllers: Class[], moduleName: string) {
  const aControllerMetadata: ControllerMetadata1[] = [];
  for (const controller of controllers) {
    const controllerMetadata1 = getControllerMetadata1(controller, moduleName);
    aControllerMetadata.push(controllerMetadata1);
  }

  return aControllerMetadata;
}

export function getControllerMetadata1(Controller: Class, moduleName: string) {
  const decoratorsAndValues = reflector.getMetadata(Controller).constructor.decorators;
  if (!decoratorsAndValues.find(isController)) {
    throw new Error(
      `Collecting controller's metadata in ${moduleName} failed: class ` +
        `"${Controller.name}" does not have the "@controller()" decorator.`
    );
  }
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
