import * as http from 'http';
import * as http2 from 'http2';
import { Provider } from 'ts-di';

export type NodeRequest = http.IncomingMessage | http2.Http2ServerRequest;
export type NodeResponse = http.ServerResponse | http2.Http2ServerResponse;
export type RequestListener = (request: NodeRequest, response: NodeResponse) => void;

export class Logger {
  /**
   * Uses `util.format` for msg formatting.
   */
  debug(format: any, ...params: any[]) {}
}

export class ApplicationOptions {
  serverName?: string;
  /**
   * Providers of services (aka plugins) for Dependecy Injection per server
   */
  providersPerApp?: Provider[];
}
