import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { ModuleType, ModuleWithParams, NormalizedGuard, ServiceProvider } from './mix';

export class SiblingsMetadata {
  siblingsPerMod = new Map<ModuleType | ModuleWithParams, ServiceProvider[]>();
  siblingsPerRou = new Map<ModuleType | ModuleWithParams, ServiceProvider[]>();
  siblingsPerReq = new Map<ModuleType | ModuleWithParams, ServiceProvider[]>();
}

export class MetadataPerMod extends SiblingsMetadata{
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  moduleMetadata: NormalizedModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
}
