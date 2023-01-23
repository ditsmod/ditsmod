import { randomUUID } from 'crypto';

export class Req {
  #requestId: string;

  get requestId() {
    if (!this.#requestId) {
      this.#requestId = randomUUID();
    }
    return this.#requestId;
  }
}
