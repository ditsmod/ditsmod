import { Application } from '../../../src/application';
import { HelloWorldController as Controller } from '../controllers/hello-world.controller';

export function routes(app: Application): void {
  app
    .route('GET', '/hello', Controller, 'helloWorld')
    .route('GET', '/send-error', Controller, 'sendError')
    .route('GET', '/redirect-301', Controller, 'redirect301')
    .route('GET', '/show-log', Controller, 'showLog');
}
