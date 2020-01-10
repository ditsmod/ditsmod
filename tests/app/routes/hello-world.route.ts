import { Application } from '../../../src/application';
import { HelloWorldController } from '../controllers/hello-world.controller';

export function routes(app: Application): void {
  app
    .route('GET', '/hello', HelloWorldController, 'helloWorld')
    .route('GET', '/send-error', HelloWorldController, 'sendError')
    .route('GET', '/redirect-301', HelloWorldController, 'redirect301');
}
