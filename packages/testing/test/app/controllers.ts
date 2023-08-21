import { controller, Injector, Res, route } from '@ditsmod/core';

import {
  ServicePerApp,
  ServicePerMod,
  ServicePerRou,
  ServicePerReq,
  ServicePerRou2,
  ServicePerReq2,
  ServicePerRou3
} from './services';

@controller({
  providersPerRou: [ServicePerRou2],
  providersPerReq: [ServicePerReq2],
})
export class Controller1 {
  @route('GET', 'per-app')
  perApp(res: Res, perApp: ServicePerApp) {
    res.send(perApp.method());
  }

  @route('GET', 'per-mod')
  perMod(res: Res, perMod: ServicePerMod) {
    res.send(perMod.method());
  }

  @route('GET', 'per-rou')
  perRou(res: Res, perRou: ServicePerRou) {
    res.send(perRou.method());
  }

  @route('GET', 'per-req')
  perReq(res: Res, perReq: ServicePerReq) {
    res.send(perReq.method());
  }

  @route('GET', 'per-rou2')
  perRou2(res: Res, perRou2: ServicePerRou2) {
    res.send(perRou2.method());
  }

  @route('GET', 'per-req2')
  perReq2(res: Res, perReq2: ServicePerReq2) {
    res.send(perReq2.method());
  }

  @route('GET', 'per-rou3')
  perRou3(res: Res, injector: Injector) {
    const perRou3 = injector.get(ServicePerRou3); // This provider is not passed to DI
    res.send(perRou3.method());
  }
}
