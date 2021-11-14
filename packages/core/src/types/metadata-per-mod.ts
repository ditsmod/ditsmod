import { ResolvedSiblings } from '../models/dynamic-provider';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { SiblingMap } from '../models/sibling-map';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { ModuleType, ModuleWithParams, NormalizedGuard, ServiceProvider } from './mix';

/**
 * @todo Move this to models.
 */
export class SiblingsTokens {
  promise: Promise<ResolvedSiblings>;
  perMod: SiblingMap[];
  perRou: SiblingMap[];
  perReq: SiblingMap[];
}
export class SiblingsMap {
  siblingsPerMod = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  siblingsPerRou = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  siblingsPerReq = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
}


export class MetadataPerMod {
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  moduleMetadata: NormalizedModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
  siblingsTokens: SiblingsTokens;
}
