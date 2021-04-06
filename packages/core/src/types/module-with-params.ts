import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleType } from './mix';
import { GuardItem } from './mix';
import { AnyObj } from './mix';

export interface ModuleWithParams<T extends AnyObj = AnyObj> extends Partial<ProvidersMetadata> {
  id?: string;
  module: ModuleType<T>;
  prefix?: string;
  guards?: GuardItem[];
  [key: string]: any;
}
