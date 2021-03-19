import { ExtensionMetadata } from './extension-metadata';
import { ModuleType } from './module-type';
import { ModuleWithParams } from './module-with-params';

export interface Extension {
  init(prefixPerApp: string, metadata: Map<ModuleType | ModuleWithParams, ExtensionMetadata>): void | Promise<void>;
}
