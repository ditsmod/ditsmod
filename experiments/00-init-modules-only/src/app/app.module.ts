import { rootModule, Providers } from '@ditsmod/core';

@rootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
