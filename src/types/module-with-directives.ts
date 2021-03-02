import { GuardItem } from './guard-item';
import { ModuleType } from './module-type';
import { ModuleWithParams } from './module-with-params';

export interface ModuleWithDirectives {
  prefix?: string;
  module: ModuleType | ModuleWithParams<any>;
  guards?: GuardItem[];
}
