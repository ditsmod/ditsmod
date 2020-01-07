import { RequestListener } from './types';

export class Application {
  requestListener: RequestListener = (request, response) => response.end('Hello World!');
}
