import { MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { AnyFn, AnyObj, ModRefId } from '#types/mix.js';
import { NormalizedMeta } from '#types/normalized-meta.js';

export type ShallowImportsBase = Map<ModRefId, MetadataPerMod1>;
export type ShallowImports = Map<ModRefId, MetadataPerMod1 & { shallowImportedModules: ShallowImportedModules }>;
export type ShallowImportedModules<T extends AnyObj = AnyObj> = Map<AnyFn, { baseMeta: NormalizedMeta } & T>;
