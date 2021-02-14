import { RootModule, Router } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [
    { prefix: 'admin', module: AdminModule },
    { prefix: 'user', module: UserModule },
  ],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
