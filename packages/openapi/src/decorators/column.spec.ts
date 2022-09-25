import 'reflect-metadata';
import { reflector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe, beforeAll, afterEach } from '@jest/globals';

import { Property, PropertyDecoratorMetadata } from './property';

describe('@Column', () => {
  it('model without properties', () => {
    class Model1 {}

    expect(reflector.propMetadata(Model1)).toEqual({});
  });

  it('empty value', () => {
    class Model1 {
      @Property()
      prop1: string;
      @Property()
      prop2: string;
      @Property()
      @Property()
      prop3: string;
    }

    const actualMeta = reflector.propMetadata(Model1);
    // console.log(actualMeta);
    const expectedMeta: PropertyDecoratorMetadata = {
      prop1: [String, { schema: undefined, arrayModels: undefined }],
      prop2: [String, { schema: undefined, arrayModels: undefined }],
      prop3: [String, { schema: undefined, arrayModels: undefined }, { schema: undefined, arrayModels: undefined }],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('object', () => {
    class Model1 {
      @Property({
        type: 'string',
        minimum: 1,
      })
      prop1: string;
    }

    const actualMeta = reflector.propMetadata(Model1);
    const expectedMeta: PropertyDecoratorMetadata = {
      prop1: [
        String,
        {
          schema: {
            type: 'string',
            minimum: 1,
          },
          arrayModels: undefined,
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('array with one item', () => {
    class Model1 {
      @Property({}, Boolean)
      prop1: Boolean[];
    }

    const actualMeta = reflector.propMetadata(Model1);
    const expectedMeta: PropertyDecoratorMetadata = {
      prop1: [
        Array,
        {
          schema: {},
          arrayModels: Boolean,
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('array with multi items', () => {
    class Model1 {
      @Property({}, Boolean, String)
      prop1: [Boolean, String];
    }

    const actualMeta = reflector.propMetadata(Model1);
    const expectedMeta: PropertyDecoratorMetadata = {
      prop1: [
        Array,
        {
          schema: {},
          arrayModels: [Boolean, String],
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });
});
