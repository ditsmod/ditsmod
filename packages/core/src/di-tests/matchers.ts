import 'reflect-metadata';

// Some Map polyfills don't polyfill Map.toString correctly, which
// gives us bad error messages in tests.
// The only way to do this in Jasmine is to monkey patch a method
// to the object :-(
// (Map as any).prototype.jasmineToString = function () {
//   const m = this;
//   if (!m) {
//     return '' + m;
//   }
//   const res: any[] = [];
//   m.forEach((v: any, k: any) => {
//     res.push(`${k}:${v}`);
//   });
//   return `{ ${res.join(',')} }`;
// };

expect.extend({
  // // Custom handler for Map as Jasmine does not support it yet
  // toEqual(util) {
  //   return {
  //     compare(actual: any, expected: any) {
  //       return { pass: util.equals(actual, expected, [compareMap]) };
  //     },
  //   };

  //   function compareMap(actual: any, expected: any): boolean {
  //     if (actual instanceof Map) {
  //       let pass = actual.size === expected.size;
  //       if (pass) {
  //         actual.forEach((v: any, k: any) => {
  //           pass = pass && util.equals(v, expected.get(k));
  //         });
  //       }
  //       return pass;
  //     } else {
  //       // TODO(misko): we should change the return, but jasmine.d.ts is not null safe
  //       // tslint:disable-next-line:no-non-null-assertion
  //       return undefined!;
  //     }
  //   }
  // },

  toBePromise(actual: any) {
    const pass = typeof actual == 'object' && typeof actual.then == 'function';
    return {
      pass,
      message() {
        return 'Expected ' + actual + ' to be a promise';
      },
    };
  },

  toContainError(actual: any, expectedText: any) {
    const errorMessage = actual.toString();
    return {
      pass: errorMessage.indexOf(expectedText) > -1,
      message() {
        return 'Expected ' + errorMessage + ' to contain ' + expectedText;
      },
    };
  },

  toImplement(actualObject: any, expectedInterface: any) {
    const intProps = Object.keys(expectedInterface.prototype);

    const missedMethods: any[] = [];
    intProps.forEach((k) => {
      if (!actualObject.constructor.prototype[k]) {
        missedMethods.push(k);
      }
    });

    return {
      pass: missedMethods.length == 0,
      message() {
        return 'Expected ' + actualObject + ' to have the following methods: ' + missedMethods.join(', ');
      },
    };
  },
});
