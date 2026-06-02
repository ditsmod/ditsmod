import type * as http from 'node:http';
import type { Http2ServerRequest, Http2ServerResponse } from 'http2';

export type RawRequest = http.IncomingMessage | Http2ServerRequest;
export type RawResponse = http.ServerResponse | Http2ServerResponse;
export type RequestListener = (request: RawRequest, response: RawResponse) => void | Promise<void>;
