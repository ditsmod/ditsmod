import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { SiblingObj } from '../models/sibling-obj';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { ModuleType, ModuleWithParams, NormalizedGuard, ServiceProvider } from './mix';

/**
 * @todo Move this to models.
 */
export class SiblingsMetadata {
  siblingsPerMod = new Set<SiblingObj>();
  siblingsPerRou = new Set<SiblingObj>();
  siblingsPerReq = new Set<SiblingObj>();
}
export class SiblingsMap {
  siblingsPerMod = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  siblingsPerRou = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  siblingsPerReq = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
}
export class MetadataPerMod extends SiblingsMetadata {
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  moduleMetadata: NormalizedModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
}
