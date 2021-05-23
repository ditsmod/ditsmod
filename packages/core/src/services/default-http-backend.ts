import { Injectable } from '@ts-stack/di';

import { HttpBackend } from '../types/http-interceptor';
import { Request } from './request';
import { RouteMeta } from '../types/route-data';

@Injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(private req: Request, private routeMeta: RouteMeta) {}

  async handle() {
    const { controller, methodName } = this.routeMeta;
    const ctrl = this.req.injector.get(controller);
    return await ctrl[methodName]();
  }
}
