import { InjectionToken } from '#di';
import { HttpServer } from '#types/server-options.js';

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<HttpServer>('SERVER');
