import { featureModule } from '@ditsmod/core';
import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

@featureModule({
  providersPerMod: [Service1, Service2],
  exports: [Service2]
})
export class Module1 {}
