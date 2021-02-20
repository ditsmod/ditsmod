import { ModuleType, ModuleWithOptions } from '../decorators/module';
import { GuardItem } from '../decorators/route';

export interface ImportWithOptions {
  prefix?: string;
  module: ModuleType | ModuleWithOptions<any>;
  guards?: GuardItem[];
}
