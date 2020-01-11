import { Application } from '../../../src/application';
import { SomeServiceController as Controller } from '../controllers/some-service.controller';

export function routes(app: Application): void {
  app.setRoute('GET', '/some-resource', Controller, 'callSomeService');
}
