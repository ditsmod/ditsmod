import { featureModule } from '@ditsmod/core';
import { I18nProviders } from '@ditsmod/i18n';
import { ValidationModule } from '@ditsmod/openapi-validation';
import { BodyParserModule } from '@ditsmod/body-parser';
import { RoutingModule } from '@ditsmod/routing';

import { FirstController } from './first.controller.js';
import { current } from './locales/current/index.js';
import { imported } from './locales/imported/index.js';

@featureModule({
  imports: [RoutingModule, BodyParserModule, ValidationModule.withParams(current)],
  controllers: [FirstController],
  providersPerMod: [...new I18nProviders().i18n({ imported })],
})
export class FirstModule {}
