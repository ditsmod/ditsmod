import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { AuthjsSingletonController } from './authjs-singleton.controller.js';

/**
 * Ditsmod module to support [Auth.js][1].
 * 
 * [1]: https://authjs.dev/
 */
@featureModule({
  imports: [RoutingModule],
  controllers: [AuthjsSingletonController],
})
export class AuthjsModule {}
