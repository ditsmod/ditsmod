import { Application } from '../../../src/application';
import { ParamsController } from '../controllers/params.controller';

export function routes(app: Application): void {
  app.route('GET', '/another/:param1/:param2', ParamsController, 'getParams');
}
