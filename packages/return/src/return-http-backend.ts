import { Injectable, Injector } from '@ts-stack/di';
import { RouteMeta, HttpBackend, Res, DefaultHttpBackend } from '@ditsmod/core';

@Injectable()
export class ReturnHttpBackend extends DefaultHttpBackend implements HttpBackend {
  constructor(protected override injector: Injector, protected override routeMeta: RouteMeta, protected res: Res) {
    super(injector, routeMeta);
  }

  override async handle() {
    const value = await super.handle(); // Controller's route returned value.
    if (typeof value == 'object' || this.res.nodeRes.getHeader('content-type') == 'application/json') {
      this.res.sendJson(value);
    } else {
      this.res.send(value);
    }
  }
}
