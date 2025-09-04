import { InjectionToken } from '@ditsmod/core';

import { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { RawRequest, RawResponse } from '#services/request.js';
import { HttpServer } from './server-options.js';

export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
/**
 * DI token for native webserver request.
 */
export const RAW_REQ = new InjectionToken<RawRequest>('RAW_REQ');
/**
 * DI token for native webserver response.
 */
export const RAW_RES = new InjectionToken<RawResponse>('RAW_RES');

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<HttpServer>('SERVER');
