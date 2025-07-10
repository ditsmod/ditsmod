import { AnyFn, AnyObj, ModRefId } from '#types/mix.js';
import { NormalizedMeta } from '#types/normalized-meta.js';

export type ShallowImportsPerDecor = Map<AnyFn, Map<ModRefId, { baseMeta: NormalizedMeta } & AnyObj>>;
