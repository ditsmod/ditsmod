import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { ModuleMetadata } from './module-metadata';
import { NormalizedGuard } from './normalized-guard';

export class ExtensionMetadata {
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  moduleMetadata: ModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
}
