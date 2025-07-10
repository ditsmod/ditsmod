import { Provider, NormalizedMeta } from '@ditsmod/core';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RestModRefId, RestNormalizedMeta } from '#init/rest-normalized-meta.js';


export class RestImportObj<T extends Provider = Provider> {
  modRefId: RestModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}
/**
 * Metadata collected using `ShallowProvidersCollector`. The target for this metadata is `DeepProvidersCollector`.
 */
export class RestMetadataPerMod1 {
  baseMeta: NormalizedMeta;
  prefixPerMod: string;
  guardsPerMod1: GuardPerMod1[];
  /**
   * Snapshot of `RestNormalizedMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: RestNormalizedMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: RestImportedTokensMap;
  applyControllers?: boolean;
}

export interface RestImportedTokensMap {
  perRou: Map<any, RestImportObj>;
  perReq: Map<any, RestImportObj>;
  multiPerRou: Map<RestModRefId, Provider[]>;
  multiPerReq: Map<RestModRefId, Provider[]>;
}

export class RestProvidersForMod {
  // providersPerMod: Provider[] = [];
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}
/**
 * This metadata returns from `DeepProvidersCollector`. The target for this metadata is `RoutesExtension`.
 */

export class RestMetadataPerMod2 {
  baseMeta: NormalizedMeta;
  meta: RestNormalizedMeta;
  guardsPerMod1: GuardPerMod1[];
  prefixPerMod: string;
  applyControllers?: boolean;
}

