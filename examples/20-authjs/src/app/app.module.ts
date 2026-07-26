import { restRootModule } from '@ditsmod/rest';
import { AuthjsConfig, AuthjsModule } from '@ditsmod/authjs';

import { OverriddenAuthConfig } from './authjs.config.js';
import { AuthController } from './auth.controller.js';

@restRootModule({
  imports: [
    AuthjsModule.withConfig({
      token: AuthjsConfig,
      useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig],
    }),
  ],
  controllers: [AuthController],
})
export class AppModule {}
