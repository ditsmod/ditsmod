import * as http from 'http';
import * as http2 from 'http2';

export type NodeRequest = http.IncomingMessage | http2.Http2ServerRequest;
export type NodeResponse = http.ServerResponse | http2.Http2ServerResponse;
export type RequestListener = (request: NodeRequest, response: NodeResponse) => void;
