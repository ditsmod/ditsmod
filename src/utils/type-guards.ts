import { ModuleMetadata } from '../decorators/module';

export function isModule(moduleMetadata: any): moduleMetadata is ModuleMetadata {
  return moduleMetadata?.ngMetadataName == 'Module';
}
