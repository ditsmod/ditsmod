import { describe, expect, it } from 'vitest';
import { getDebugClassName } from './get-debug-class-name.js';
import { ModuleWithParams } from '#types/module-metadata.js';

describe('getDebugClassName()', () => {
  it('case1', () => {
    class Module1 {}
    const modRefId2: ModuleWithParams = { module: Module1, params: [] };
    const modRefId3: ModuleWithParams = { module: Module1, params: [] };
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-2');

    // Repeat
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-2');

    // Other Name
    expect(getDebugClassName(modRefId3)).toBe('Module1-3');
    expect(getDebugClassName(modRefId3)).toBe('Module1-3');
  });
});
