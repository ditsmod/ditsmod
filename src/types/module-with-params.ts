import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleType } from './module-type';
import { GuardItem } from './guard-item';
import { AnyObj } from './any-obj';

export interface ModuleWithParams<T extends ModuleType<AnyObj> = ModuleType<AnyObj>> extends Partial<ProvidersMetadata> {
  module: ModuleType<T>;
  prefix?: string;
  guards?: GuardItem[];
  [key: string]: any;
}
