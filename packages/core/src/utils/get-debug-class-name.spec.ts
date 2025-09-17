import { getDebugClassName } from './get-debug-class-name.js';
import { ModuleWithParams } from '#decorators/module-raw-metadata.js';

describe('getDebugClassName()', () => {
  it('case1', () => {
    class Module1 {}
    const modRefId2: ModuleWithParams = { module: Module1, providersPerMod: [] };
    const modRefId3: ModuleWithParams = { module: Module1, providersPerMod: [] };
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-WithParams');

    // Repeat
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-WithParams');

    // Other Name
    expect(getDebugClassName(modRefId3)).toBe('Module1-WithParams-2');
    expect(getDebugClassName(modRefId3)).toBe('Module1-WithParams-2');
  });
});
