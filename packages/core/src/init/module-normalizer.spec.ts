import { beforeEach, describe, expect, it, vi } from 'vitest';

import { featureModule, RawMeta } from '#decorators/module.js';
import { rootModule } from '#decorators/root-module.js';
import { InjectionToken, injectable, forwardRef, Provider } from '#di';
import { Extension } from '#extension/extension-types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleManager } from './module-manager.js';
import { ModuleType, AnyObj } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';

describe('ModuleNormalizer', () => {
  console.log = vi.fn();
  type ModuleId = string | ModuleType | ModuleWithParams;
  @injectable()
  class Provider0 {}
  @injectable()
  class Provider1 {}
  @injectable()
  class Provider2 {}
  @injectable()
  class Provider3 {}

  class MockModuleNormalizer extends ModuleNormalizer {}

  let mock: MockModuleNormalizer;

  beforeEach(() => {
    clearDebugClassNames();
  });
});
