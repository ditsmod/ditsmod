import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleType } from './module-type';
import { GuardItem } from './guard-item';

export interface ModuleWithParams<T extends ModuleType> extends Partial<ProvidersMetadata> {
  module: T;
  prefix?: string;
  guards?: GuardItem[];
  [key: string]: unknown;
}
