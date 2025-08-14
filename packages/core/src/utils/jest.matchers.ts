import { CustomError } from '#error/custom-error.js';
import { AnyFn } from '#types/mix.js';
import { diff } from 'jest-diff';

export const toThrowCode: jest.CustomMatcher = (received: AnyFn, fn: AnyFn, expectedMessage?: string) => {
  const expectedCode = fn.name || 'anonymous';
  if (typeof received != 'function') {
    return {
      pass: false,
      message: () => `Expected a function to be tested, but received ${typeof received}`,
    };
  }

  try {
    received();
  } catch (err) {
    const actualCode = (err as CustomError).code;
    const actualMessage = (err as CustomError).message;
    let pass = actualCode === expectedCode;
    let wrongMessage = false;
    if (pass && expectedMessage) {
      pass = actualMessage.includes(expectedMessage);
      wrongMessage = !pass;
    }

    return {
      pass,
      message: () => {
        if (pass) {
          return `Expected function not to throw code "${expectedCode}"`;
        }

        if (wrongMessage) {
          const diffString = diff(expectedMessage, actualMessage, { expand: false });

          return `Difference:\n${diffString}`;
        } else {
          const diffString = diff(expectedCode, actualCode, { expand: false });

          return (
            `Expected function to throw code "${expectedCode}", ` +
            `but got code "${actualCode}" and message "${actualMessage}"` +
            `\n\nDifference:\n${diffString}`
          );
        }
      },
    };
  }

  return {
    pass: false,
    message: () => `Function did not throw at all`,
  };
};
