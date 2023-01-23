import { randomUUID } from 'crypto';

export class Req {
  #requestId: string;
  /**
   * Object with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParams?: any;
  /**
   * This value is set after checking `guard.canActivate()` and before parse the request body.
   * Here is the result of the `querystring.parse()` function,
   * so if query params are missing, there will be an empty object.
   */
  queryParams?: any = {};

  get requestId() {
    if (!this.#requestId) {
      this.#requestId = randomUUID();
    }
    return this.#requestId;
  }
}
