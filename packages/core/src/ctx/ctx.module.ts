import { featureModule } from '#decorators/feature-module.js';
import { getTokens } from '#utils/get-tokens.js';
import { contextProviders } from './providers.js';

@featureModule({
  providersPerApp: [...contextProviders],
  providersPerMod: [...contextProviders],
  providersPerRou: [...contextProviders],
  providersPerReq: [...contextProviders],
  exports: getTokens(contextProviders),
})
export class ContextModule {}
