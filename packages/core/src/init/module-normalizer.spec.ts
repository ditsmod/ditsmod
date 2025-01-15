import { describe, beforeEach } from 'vitest';

import { ModuleNormalizer } from '#init/module-normalizer.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {}

  let mock: MockModuleNormalizer;

  beforeEach(() => {
    mock = new MockModuleNormalizer();
  });

  // it('without @controller decorator', () => {
  //   const msg = 'Collecting controller\'s metadata in TestModuleName failed: class "Controller1"';
  //   expect(() => mock.checkController('TestModuleName', class Controller1 {})).toThrow(msg);
  // });
});
