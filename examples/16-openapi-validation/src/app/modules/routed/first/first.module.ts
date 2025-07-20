import { featureModule } from '@ditsmod/core';
import { I18nProviders } from '@ditsmod/i18n';
import { ValidationModule } from '@ditsmod/openapi-validation';
import { BodyParserModule } from '@ditsmod/body-parser';
import { initRest } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';
import { current } from './locales/current/index.js';
import { imported } from './locales/imported/index.js';

@initRest({ controllers: [FirstController] })
@featureModule({
  imports: [BodyParserModule, ValidationModule.withParams(current)],
  providersPerMod: new I18nProviders().i18n({ imported }),
})
export class FirstModule {}
