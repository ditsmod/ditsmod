import { controller } from '@ditsmod/routing';

import { route } from '#mod/decorators/route.js';
import {
  ServicePerApp,
  ServicePerMod,
  ServicePerRou,
  ServicePerReq,
  ServicePerRou2,
  ServicePerReq2,
} from './services.js';

@controller({
  providersPerRou: [ServicePerRou2],
  providersPerReq: [ServicePerReq2],
})
export class Controller1 {
  @route('GET', 'per-app')
  perApp(perApp: ServicePerApp) {
    return perApp.method();
  }

  @route('GET', 'per-mod')
  perMod(perMod: ServicePerMod) {
    return perMod.method();
  }

  @route('GET', 'per-rou')
  perRou(perRou: ServicePerRou) {
    return perRou.method();
  }

  @route('GET', 'per-req')
  perReq(perReq: ServicePerReq) {
    return perReq.method();
  }

  @route('GET', 'per-rou2')
  perRou2(perRou2: ServicePerRou2) {
    return perRou2.method();
  }

  @route('GET', 'per-req2')
  perReq2(perReq2: ServicePerReq2) {
    return perReq2.method();
  }
}
