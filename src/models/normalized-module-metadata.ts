import { ControllerType } from '../types/controller-type';
import { ExtensionType } from '../types/extension-type';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';
import { ProvidersMetadata } from './providers-metadata';

export class NormalizedModuleMetadata extends ProvidersMetadata {
  imports1?: ModuleType[] = [];
  imports2?: ModuleWithParams[] = [];
  controllers?: ControllerType[] = [];
  extensions?: ExtensionType[] = [];
  ngMetadataName: string;
  exports1?: ModuleType[] = [];
  exports2?: ModuleWithParams[] = [];
  exports3?: ServiceProvider[] = [];
}
