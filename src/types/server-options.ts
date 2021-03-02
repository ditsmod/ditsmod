import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';

export type Http2SecureServerOptions = http2.SecureServerOptions & { isHttp2SecureServer: boolean };
export type ServerOptions = http.ServerOptions | https.ServerOptions | http2.ServerOptions | Http2SecureServerOptions;
