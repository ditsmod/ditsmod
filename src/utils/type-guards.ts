import { ControllerMetadata } from '../decorators/controller';
import { RouteMetadata } from '../decorators/route';
import { ModuleMetadata } from '../types/module-metadata';
import { ModuleWithParams } from '../types/module-with-params';
import { RootModuleMetadata } from '../types/root-module-metadata';

export function isModule(moduleMetadata: any): moduleMetadata is ModuleMetadata {
  return moduleMetadata?.ngMetadataName == 'Module';
}

export function isRootModule(moduleMetadata: any): moduleMetadata is RootModuleMetadata {
  return moduleMetadata?.ngMetadataName == 'RootModule';
}

export function isController(ctrlMeatada: ControllerMetadata): ctrlMeatada is ControllerMetadata {
  return (ctrlMeatada as any)?.ngMetadataName == 'Controller';
}

export function isRoute(propMeatada: RouteMetadata): propMeatada is RouteMetadata {
  return (propMeatada as any)?.ngMetadataName == 'Route';
}

export function isModuleWithParams(imp: any): imp is ModuleWithParams<any> {
  return (imp as ModuleWithParams<any>)?.module !== undefined;
}
