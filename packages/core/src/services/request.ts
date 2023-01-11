import { randomUUID } from 'crypto';

import { PathParam } from '../types/router';

export class Req {
  #requestId: string;
  /**
   * Object with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParams?: any;
  /**
   * Array with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  aPathParams?: PathParam[];
  /**
   * This value is set after checking `guard.canActivate()` and before parse the request body.
   * Here is the result of the `querystring.parse()` function,
   * so if query params are missing, there will be an empty object.
   */
  queryParams?: any = {};
  /**
   * For this parameter, request is not automatically parsed. To get it,
   * you can use `@ditsmod/body-parser`.
   *
   * This value is set after checking `guard.canActivate()` and seting `queryParams`.
   */
  body?: any;
  /**
   * Payload of JSON Web Token. For this parameter, request is not automatically parsed.
   * To get JWT payload, you can use the `@ditsmod/jwt` module.
   */
  jwtPayload?: any;

  get requestId() {
    if (!this.#requestId) {
      this.#requestId = randomUUID();
    }
    return this.#requestId;
  }
}
