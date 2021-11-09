import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { SiblingObj } from '../models/sibling-obj';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { ModuleType, ModuleWithParams, NormalizedGuard } from './mix';

export class SiblingsMetadata {
  siblingsPerMod = new Map<ModuleType | ModuleWithParams, SiblingObj>();
  siblingsPerRou = new Map<ModuleType | ModuleWithParams, SiblingObj>();
  siblingsPerReq = new Map<ModuleType | ModuleWithParams, SiblingObj>();
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
