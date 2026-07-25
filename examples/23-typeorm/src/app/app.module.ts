import { restRootModule } from '@ditsmod/rest';
import { TypeormModule } from '@ditsmod/typeorm';

import { UserModule } from './modules/user/user.module.js';
import { SystemModule } from './modules/system/system.module.js';

@restRootModule({
  appends: [UserModule, SystemModule],
  imports: [
    TypeormModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      username: process.env.MYSQL_USERNAME || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'test_db',
      synchronize: true, // ⚠️ Warning: Disable synchronize in production! Use migrations instead.
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
