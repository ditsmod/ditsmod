import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleType, ModuleWithParams } from './mix';

export type ModulesMap = Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>;
export type ModulesMapId = Map<string, ModuleType | ModuleWithParams>;
