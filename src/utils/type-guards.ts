import { ModuleMetadata } from '../types/module-metadata';
import { RootModuleMetadata } from '../types/root-module-metadata';

export function isModule(moduleMetadata: any): moduleMetadata is ModuleMetadata {
  return moduleMetadata?.ngMetadataName == 'Module';
}

export function isRootModule(moduleMetadata: any): moduleMetadata is RootModuleMetadata {
  return moduleMetadata?.ngMetadataName == 'RootModule';
}
