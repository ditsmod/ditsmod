import 'reflect-metadata';
import { Injectable } from '@ts-stack/di';

import { ImportsResolver } from './imports-resolver';
import { MetadataPerMod1 } from './types/metadata-per-mod';

describe('ImportsResolver', () => {
  @Injectable()
  class ImportsResolverMock extends ImportsResolver {
    override resolveImportedProviders(metadataPerMod1: MetadataPerMod1) {
      return super.resolveImportedProviders(metadataPerMod1);
    }
  }
  let mock: ImportsResolverMock;

  beforeEach(() => {
    mock = new ImportsResolverMock(null as any, null as any);
  });

  describe('resolveImportedProviders', () => {
    it('case 1', () => {
      
    });
  });
});
