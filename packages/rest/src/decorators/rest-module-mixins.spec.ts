import { Reflector } from '@holu/core';
import { mixinRest, restRootModule } from './rest-module-mixins.js';

describe('restRootModule decorator', () => {
  it('empty decorator', () => {
    @restRootModule({})
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decoratorId).toBe(mixinRest);
    expect(metadata[0].declaredInDir).toContain('holu/packages/rest/dist/decorators');
  });
});
