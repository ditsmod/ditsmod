import { Application } from '../../../src/application';
import { HelloWorldController as Controller } from '../controllers/hello-world.controller';

export function routes(app: Application): void {
  app
    .setRoute('GET', '/hello', Controller, 'helloWorld')
    .setRoute('GET', '/send-error', Controller, 'sendError')
    .setRoute('GET', '/redirect-301', Controller, 'redirect301')
    .setRoute('GET', '/show-log', Controller, 'showLog');
}
