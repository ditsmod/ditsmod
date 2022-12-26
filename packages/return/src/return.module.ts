import { HttpBackend, featureModule } from '@ditsmod/core';

import { ReturnHttpBackend } from './return-http-backend';

/**
 * Allow listen value returned by a controller's route.
 */
@featureModule({
  providersPerReq: [{ token: HttpBackend, useClass: ReturnHttpBackend }],
  exports: [HttpBackend]
})
export class ReturnModule {}
