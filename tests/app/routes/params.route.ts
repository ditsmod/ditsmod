import { Application } from '../../../src/application';
import { ParamsController as Controller } from '../controllers/params.controller';

export function routes(app: Application): void {
  app.setRoute('GET', '/another/:param1/:param2', Controller, 'getParams');
}
