import { featureModule, ProviderBuilder } from '@ditsmod/core';
import { DispatcherExtension, RestRouteExtension } from '@ditsmod/rest';
import { BodyParserExtension } from '@ditsmod/body-parser';

import { AjvService } from './ajv.service.js';
import { AJV_OPTIONS } from './constants.js';
import { ValidationExtension } from './validation.extension.js';

@featureModule({
  providersPerApp: new ProviderBuilder().passThrough(AjvService).useValue(AJV_OPTIONS, { coerceTypes: true }),
  extensions: [
    {
      extension: ValidationExtension,
      afterExtensions: [BodyParserExtension, RestRouteExtension],
      beforeExtensions: [DispatcherExtension],
      exportOnly: true,
    },
  ],
})
export class ValidationModule {}
