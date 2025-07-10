import { MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { AnyFn, AnyObj, ModRefId } from '#types/mix.js';
import { NormalizedMeta } from '#types/normalized-meta.js';

export type ShallowImportsBase = Map<ModRefId, MetadataPerMod1>;
export type ShallowImportsPerDecor = Map<AnyFn, Map<ModRefId, { baseMeta: NormalizedMeta } & AnyObj>>;
