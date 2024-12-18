import { randomUUID } from 'node:crypto';
import { TLSSocket } from 'node:tls';

import { inject } from '#di/decorators.js';
import { RAW_REQ } from '#public-api/constans.js';
import { RawRequest } from '#types/server-options.js';

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
