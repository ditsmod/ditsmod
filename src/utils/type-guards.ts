import { ModuleMetadata } from '../types/module-metadata';

export function isModule(moduleMetadata: any): moduleMetadata is ModuleMetadata {
  return moduleMetadata?.ngMetadataName == 'Module';
}
