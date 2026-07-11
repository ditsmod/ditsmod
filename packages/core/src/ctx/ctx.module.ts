import { featureModule } from '#decorators/feature-module.js';
import { getTokens } from '#utils/get-tokens.js';
import { ctxProviders } from './providers.js';

@featureModule({
  providersPerApp: [...ctxProviders],
  providersPerMod: [...ctxProviders],
  providersPerRou: [...ctxProviders],
  providersPerReq: [...ctxProviders],
  exports: getTokens(ctxProviders),
})
export class ContextModule {}
