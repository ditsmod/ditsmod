const { toThrowCode } = await import('./dist/utils/jest.matchers.js');

expect.extend({ toThrowCode });
