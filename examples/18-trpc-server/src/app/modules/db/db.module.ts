import { featureModule } from '@holu/core';
import { DbService } from '#db/db.service.js';

@featureModule({
  providersPerMod: [DbService],
  exports: [DbService],
})
export class DbModule {}
