import { getDebugModuleName } from './get-debug-module-name.js';

describe('getDebugModuleName()', () => {
  it('case1', () => {
    class Module1 {}
    const modRefId2 = { module: Module1 };
    const modRefId3 = { module: Module1 };
    expect(getDebugModuleName(Module1)).toBe('Module1');
    expect(getDebugModuleName(modRefId2)).toBe('Module1-2');

    // Repeat
    expect(getDebugModuleName(Module1)).toBe('Module1');
    expect(getDebugModuleName(modRefId2)).toBe('Module1-2');

    // Other Name
    expect(getDebugModuleName(modRefId3)).toBe('Module1-3');
    expect(getDebugModuleName(modRefId3)).toBe('Module1-3');
  });
});
