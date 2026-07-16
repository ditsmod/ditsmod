import type { RawResponse } from './request.js';

export abstract class HeadStrategy {
  /**
   * Given the real RawResponse, return the effective response
   * to use for a HEAD request (may be a wrapper or the real one).
   */
  abstract wrap(rawRes: RawResponse): RawResponse;
}
