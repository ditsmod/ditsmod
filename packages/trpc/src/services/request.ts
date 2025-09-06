import { inject } from '@ditsmod/core';
import { randomUUID } from 'node:crypto';
import { TLSSocket } from 'node:tls';
import type * as http from 'node:http';
import { Http2ServerRequest, Http2ServerResponse } from 'http2';

import { RAW_REQ } from '#types/types.js';

export class Req {
  #requestId: string;
  constructor(
    /**
     * Native webserver request.
     */
    @inject(RAW_REQ) public rawReq: RawRequest,
  ) {}

  get requestId() {
    if (!this.#requestId) {
      this.#requestId = randomUUID();
    }
    return this.#requestId;
  }

  get protocol() {
    return this.rawReq.socket instanceof TLSSocket && this.rawReq.socket.encrypted ? 'https' : 'http';
  }
}

export type RawRequest = http.IncomingMessage | Http2ServerRequest;
export type RawResponse = http.ServerResponse | Http2ServerResponse;
export type RequestListener = (request: RawRequest, response: RawResponse) => void | Promise<void>;
