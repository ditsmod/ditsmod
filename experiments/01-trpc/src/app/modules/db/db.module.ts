import { featureModule } from '@ditsmod/core';
import { DbService } from './db.service.js';

@featureModule({
  providersPerMod: [DbService],
  exports: [DbService],
})
export class DbModule {}
