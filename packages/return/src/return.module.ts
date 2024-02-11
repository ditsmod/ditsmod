import { HttpBackend, featureModule } from '@ditsmod/core';

import { ReturnHttpBackend } from './return-http-backend.js';
import { SingletonReturnHttpBackend } from './singleton-return-http-backend.js';

/**
 * Allow listen value returned by a controller's route.
 */
@featureModule({
  providersPerRou: [{ token: HttpBackend, useClass: SingletonReturnHttpBackend }],
  providersPerReq: [{ token: HttpBackend, useClass: ReturnHttpBackend }],
  exports: [HttpBackend]
})
export class ReturnModule {}
