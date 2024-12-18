import { featureModule } from '@ditsmod/core';
import { AuthjsSingletonController } from './authjs-singleton.controller.js';

@featureModule({
  controllers: [AuthjsSingletonController],
})
export class AuthjsModule {}
