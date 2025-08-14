import { AnyFn } from '../types/mix.js';

declare global {
  namespace jest {
    interface Matchers<R> {
      toThrowCode(expectedCode: AnyFn, message?: string): R;
    }
  }
}

export {};
