import 'reflect-metadata';
import { describe, it, fit, expect, beforeEach } from '@jest/globals';

import { CorsExtension } from './cors.extension';

describe('CorsExtension', () => {
  let candidate: CorsExtension;

  beforeEach(() => {
    candidate = new CorsExtension({} as any, {} as any);
  });
  it('case 1', () => {});
});
