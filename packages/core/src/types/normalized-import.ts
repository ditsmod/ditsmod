import { AnyObj } from './mix';
import { ModuleType } from './mix';
import { NormalizedGuard } from './mix';

export interface NormalizedImport<T extends ModuleType<AnyObj> = ModuleType<AnyObj>> {
  prefix: string;
  module: T;
  guards: NormalizedGuard[];
  [key: string]: any;
}
