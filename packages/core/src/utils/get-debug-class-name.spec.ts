import { clearDebugClassNames, getDebugClassName } from './get-debug-class-name.js';
import type { DynamicModule } from '#decorators/module-decorator-options.js';
import { forwardRef } from '#di/forward-ref.js';

describe('getDebugClassName()', () => {
  beforeEach(() => {
    clearDebugClassNames();
  });

  it('case1', () => {
    class Module1 {}
    const modRefId2: DynamicModule = { module: Module1, providersPerMod: [] };
    const modRefId3: DynamicModule = { module: Module1, providersPerMod: [] };
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-DynamicModule');

    // Repeat
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-DynamicModule');

    // Other Name
    expect(getDebugClassName(modRefId3)).toBe('Module1-DynamicModule-2');
    expect(getDebugClassName(modRefId3)).toBe('Module1-DynamicModule-2');
  });

  it('case2', () => {
    class Module1 {}
    const modRefId2: DynamicModule = { module: forwardRef(() => Module1), providersPerMod: [] };
    const modRefId3: DynamicModule = { module: forwardRef(() => Module1), providersPerMod: [] };
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-DynamicModule');

    // Repeat
    expect(getDebugClassName(Module1)).toBe('Module1');
    expect(getDebugClassName(modRefId2)).toBe('Module1-DynamicModule');

    // Other Name
    expect(getDebugClassName(modRefId3)).toBe('Module1-DynamicModule-2');
    expect(getDebugClassName(modRefId3)).toBe('Module1-DynamicModule-2');
  });
});
