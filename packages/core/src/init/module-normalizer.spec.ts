import { describe, expect, it, beforeEach } from 'vitest';

import { ModuleNormalizer } from '#init/module-normalizer.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {
    override quickCheckMetadata(meta: NormalizedModuleMetadata) {
      return super.quickCheckMetadata(meta);
    }

    // override checkController(modName: string, Controller: Class) {
    //   return super.checkController(modName, Controller);
    // }
  }

  let mock: MockModuleNormalizer;

  beforeEach(() => {
    mock = new MockModuleNormalizer();
  });

  // it('without @controller decorator', () => {
  //   const msg = 'Collecting controller\'s metadata in TestModuleName failed: class "Controller1"';
  //   expect(() => mock.checkController('TestModuleName', class Controller1 {})).toThrow(msg);
  // });
});
