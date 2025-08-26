import { featureModule } from '@ditsmod/core';
import { DbService } from './db.service.js';

@featureModule({
  providersPerApp: [DbService],
})
export class DbModule {}
