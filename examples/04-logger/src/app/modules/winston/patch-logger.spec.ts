import { Logger } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { PatchLogger } from './patch-logger.js';

describe('PatchLogger Winston', () => {
  it('should have the necessary methods', () => {
    const patchLogger = new PatchLogger();
    expect(() => patchLogger.patchLogger({ level: 'warn' })).not.toThrow();

    const logger = patchLogger.patchLogger({ level: 'warn' }) as unknown as Logger;
    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.setLevel).toBe('function');
    expect(typeof logger.getLevel).toBe('function');
  });
});
