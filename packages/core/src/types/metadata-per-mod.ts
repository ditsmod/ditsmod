import { ReflectiveInjector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { ModuleType, ModuleWithParams, NormalizedGuard } from './mix';

/**
 * Injector sibling object.
 */
export class SiblingObj {
  tokens: any[] = [];
  resolveInjector: (value: ReflectiveInjector) => void;
  injectorPromise: Promise<ReflectiveInjector>;

  constructor() {
    this.injectorPromise = new Promise<ReflectiveInjector>(resolve => {
      this.resolveInjector = resolve;
    });
  }
}
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
