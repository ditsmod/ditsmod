import { featureModule } from '@ditsmod/core';
import { HttpBackend, RoutingModule } from '@ditsmod/routing';

import { ReturnHttpBackend } from './return-http-backend.js';
import { SingletonReturnHttpBackend } from './singleton-return-http-backend.js';

/**
 * Allow listen value returned by a controller's route. Re-exports `RoutingModule`.
 */
@featureModule({
  imports: [RoutingModule],
  providersPerRou: [{ token: HttpBackend, useClass: SingletonReturnHttpBackend }],
  providersPerReq: [{ token: HttpBackend, useClass: ReturnHttpBackend }],
  exports: [HttpBackend, RoutingModule]
})
export class ReturnModule {}
