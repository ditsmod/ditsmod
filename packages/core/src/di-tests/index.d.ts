declare global {
  /**
   * Jasmine matchers that check some specific conditions.
   */
  interface NgMatchers<R = unknown> {
    /**
     * Invert the matchers.
     */
    not: NgMatchers<R>;
    /**
     * Expect the value to be a `Promise`.
     *
     * ## Example
     *
     * {@example testing/ts/matchers.ts region='toBePromise'}
     */
    toBePromise(): boolean;

    /**
     * Expect a class to implement the interface of the given class.
     *
     * ## Example
     *
     * {@example testing/ts/matchers.ts region='toImplement'}
     */
    toImplement(expected: any): boolean;

    /**
     * Expect an exception to contain the given error text.
     *
     * ## Example
     *
     * {@example testing/ts/matchers.ts region='toContainError'}
     */
    toContainError(expected: any): boolean;
  }
  namespace jest {
    interface Expect extends NgMatchers {}
    interface Matchers<R> extends NgMatchers<R> {}
    interface InverseAsymmetricMatchers extends NgMatchers {}
  }
}

export {};
