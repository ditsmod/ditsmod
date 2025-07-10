import { MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { NormalizedMeta } from '#types/normalized-meta.js';

export type ShallowImportsBase = Map<ModuleType | ModuleWithParams, MetadataPerMod1>;
export type ShallowImportsPerDecor = Map<AnyFn, Map<ModRefId, { baseMeta: NormalizedMeta } & AnyObj>>;
