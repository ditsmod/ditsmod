import { featureModule } from '#decorators/feature-module.js';
import { getTokens } from '#utils/get-tokens.js';
import { injectorCtxProviders } from './providers.js';

@featureModule({
  providersPerApp: [...injectorCtxProviders],
  providersPerMod: [...injectorCtxProviders],
  providersPerRou: [...injectorCtxProviders],
  providersPerReq: [...injectorCtxProviders],
  exports: getTokens(injectorCtxProviders)
})
export class CtxModule {}
