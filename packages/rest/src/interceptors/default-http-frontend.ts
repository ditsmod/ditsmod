import { injectable } from '@ditsmod/core';
import { RouteScopedDefaultHttpFrontend } from './default-ctx-http-frontend.js';

@injectable()
export class DefaultHttpFrontend extends RouteScopedDefaultHttpFrontend {}
