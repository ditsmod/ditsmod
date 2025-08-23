import { BaseAppOptions, InjectionToken } from '@ditsmod/core';
import { IncomingMessage, Server, ServerResponse } from 'http';

export class TrpcAppOptions extends BaseAppOptions {}
/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<Server>('SERVER');

export type RawRequest = IncomingMessage;
export type RawResponse = ServerResponse;
