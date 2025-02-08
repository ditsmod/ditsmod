import { CallsiteUtils } from '#utils/callsites.js';

describe('CallsiteUtils.getCallerDir()', function some1() {
  const expectedPath = 'ditsmod/ditsmod/packages/core/dist/utils';

  it('inside class method and common function', function some2() {
    class Test3 {
      method1() {
        const path = CallsiteUtils.getCallerDir();
        expect(path).toContain(expectedPath);
      }
    }

    expect(function some3() {
      new Test3().method1();
    }).not.toThrow();
  });

  it('inside common function', function some2() {
    expect(function some3() {
      const path = CallsiteUtils.getCallerDir();
      expect(path).toContain(expectedPath);
    }).not.toThrow();
  });

  it('inside narrow function', () => {
    expect(() => {
      const path = CallsiteUtils.getCallerDir();
      expect(path).toContain(expectedPath);
    }).not.toThrow();
  });
});
