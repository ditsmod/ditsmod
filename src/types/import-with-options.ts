import { ModuleType, ModuleWithOptions } from '../decorators/module';
import { GuardItem } from '../decorators/route';
import { NormalizedGuard } from './router';

export interface ImportWithOptions {
  prefix?: string;
  module: ModuleType | ModuleWithOptions<any>;
  guards?: GuardItem[];
}

export interface ImportWithOptions2 {
  prefix: string;
  module: ModuleType | ModuleWithOptions<any>;
  guards: NormalizedGuard[];
}
