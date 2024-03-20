import { PropMeta, reflector } from '@ditsmod/core';

import { property, PropertyDecoratorMetadata } from './property.js';

describe('@Property', () => {
  it('model without properties', () => {
    class Model1 {}

    expect(reflector.getPropMetadata(Model1)).toEqual({});
  });

  it('empty value', () => {
    class Model1 {
      @property()
      prop1: string;
      @property()
      prop2: string;
      @property()
      @property()
      prop3: string;
    }

    const actualMeta = reflector.getPropMetadata(Model1);
    // console.log(actualMeta);
    const expectedMeta: PropMeta<PropertyDecoratorMetadata> = {
      prop1: [
        String,
        {
          decorator: property,
          value: { schema: undefined, customType: undefined },
        },
      ],
      prop2: [
        String,
        {
          decorator: property,
          value: { schema: undefined, customType: undefined },
        },
      ],
      prop3: [
        String,
        {
          decorator: property,
          value: { schema: undefined, customType: undefined },
        },
        {
          decorator: property,
          value: { schema: undefined, customType: undefined },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('object', () => {
    class Model1 {
      @property({
        type: 'string',
        minimum: 1,
      })
      prop1: string;
    }

    const actualMeta = reflector.getPropMetadata(Model1);
    const expectedMeta: PropMeta<PropertyDecoratorMetadata> = {
      prop1: [
        String,
        {
          decorator: property,
          value: {
            schema: {
              type: 'string',
              minimum: 1,
            },
            customType: undefined,
          },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('array with one item', () => {
    class Model1 {
      @property({}, { array: Boolean })
      prop1: Boolean[];
    }

    const actualMeta = reflector.getPropMetadata(Model1);
    const expectedMeta: PropMeta<PropertyDecoratorMetadata> = {
      prop1: [
        Array,
        {
          decorator: property,
          value: { schema: {}, customType: { array: Boolean } },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('array with multi items', () => {
    class Model1 {
      @property({}, { array: [Boolean, String] })
      prop1: [Boolean, String];
    }

    const actualMeta = reflector.getPropMetadata(Model1);
    const expectedMeta: PropMeta<PropertyDecoratorMetadata> = {
      prop1: [
        Array,
        {
          decorator: property,
          value: { schema: {}, customType: { array: [Boolean, String] } },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });
});
