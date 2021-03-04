import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleType } from './module-type';
import { GuardItem } from './guard-item';
import { AnyObj } from './any-obj';

export interface ModuleWithParams<T extends AnyObj = AnyObj> extends Partial<ProvidersMetadata> {
  id?: string | number;
  module: ModuleType<T>;
  prefix?: string;
  guards?: GuardItem[];
  [key: string]: any;
}
