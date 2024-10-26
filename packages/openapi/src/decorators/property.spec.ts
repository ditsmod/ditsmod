import { DecoratorAndValue, reflector } from '@ditsmod/core';

import { property } from './property.js';

describe('@property', () => {
  it('model without properties', () => {
    class Model1 {}

    expect(reflector.getMetadata(Model1)).toBeUndefined();
  });

  it('empty value', () => {
    class Model1 {
      @property()
      prop1: string;
      @property()
      prop2: number;
      @property()
      @property()
      prop3: string;
    }

    const actualMeta = reflector.getMetadata(Model1)!;
    expect(actualMeta.prop1.type).toBe(String);
    expect(actualMeta.prop2.type).toBe(Number);
    expect(actualMeta.prop3.type).toBe(String);
    const value = { schema: undefined, customType: undefined };
    expect(actualMeta.prop1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(property, value)]);
    expect(actualMeta.prop2.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(property, value)]);
    expect(actualMeta.prop3.decorators).toEqual<DecoratorAndValue[]>([
      new DecoratorAndValue(property, value),
      new DecoratorAndValue(property, value),
    ]);
  });

  it('object', () => {
    class Model1 {
      @property({
        type: 'string',
        minimum: 1,
      })
      prop1: string;
    }

    const actualMeta = reflector.getMetadata(Model1)!;
    expect(actualMeta.prop1.type).toBe(String);
    const value = {
      schema: {
        type: 'string',
        minimum: 1,
      },
      customType: undefined,
    };
    expect(actualMeta.prop1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(property, value)]);
  });

  it('array with one item', () => {
    class Model1 {
      @property({}, { array: Boolean })
      // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
      prop1: Boolean[];
    }

    const actualMeta = reflector.getMetadata(Model1)!;
    expect(actualMeta.prop1.type).toBe(Array);
    const value = { schema: {}, customType: { array: Boolean } };
    expect(actualMeta.prop1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(property, value)]);
  });

  it('array with multi items', () => {
    class Model1 {
      @property({}, { array: [Boolean, String] })
      // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
      prop1: [Boolean, String];
    }

    const actualMeta = reflector.getMetadata(Model1)!;
    expect(actualMeta.prop1.type).toBe(Array);
    const value = { schema: {}, customType: { array: [Boolean, String] } };
    expect(actualMeta.prop1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(property, value)]);
  });
});
