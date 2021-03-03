import { ControllerType } from '../types/controller-type';
import { ExtensionType } from '../types/extension-type';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { NormalizedImport } from '../types/normalized-import';
import { ServiceProvider } from '../types/service-provider';
import { ProvidersMetadata } from './providers-metadata';

export class NormalizedModuleMetadata extends ProvidersMetadata {
  imports: NormalizedImport[] = [];
  controllers: ControllerType[] = [];
  exports: Array<ModuleType | ModuleWithParams<any> | ServiceProvider> = [];
  extensions: ExtensionType[] = [];
}
