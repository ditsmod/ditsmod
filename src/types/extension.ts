import { ApplicationMetadata } from './application-metadata';
import { ModuleType } from './module-type';

export interface Extension<T = any> {
  init(prefixPerApp: string, metadata: Map<ModuleType, ApplicationMetadata>): T | Promise<T>;
}
