import { Application } from '../../../src/application';
import { SomeServiceController } from '../controllers/some-service.controller';

export function routes(app: Application): void {
  app.route('GET', '/some-resource', SomeServiceController, 'callSomeService');
}
