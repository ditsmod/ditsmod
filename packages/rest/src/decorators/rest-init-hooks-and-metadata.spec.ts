import { Reflector } from '@ditsmod/core';
import { initRest, restRootModule } from './rest-init-hooks-and-metadata.js';

describe('restRootModule decorator', () => {
  it('empty decorator', () => {
    @restRootModule({})
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decoratorId).toBe(initRest);
    expect(metadata[0].declaredInDir).toContain('ditsmod/packages/rest/dist/decorators');
  });
});
