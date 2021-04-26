import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Schema, SchemaDecoratorMetadata } from './schema';

describe('@Schema', () => {
  it('model without properties', () => {
    class Model1 {}

    expect(reflector.propMetadata(Model1)).toEqual({});
  });

  it('properly structure of model metadata with empty value', () => {
    class Model1 {
      @Schema()
      prop1: string;
      @Schema()
      prop2: string;
      @Schema()
      @Schema()
      prop3: string;
    }

    const actualMeta = reflector.propMetadata(Model1);
    // console.log(actualMeta);
    const expectedMeta: SchemaDecoratorMetadata = {
      prop1: [String, {}],
      prop2: [String, {}],
      prop3: [String, {}, {}],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('properly structure of model metadata with some value', () => {
    class Model1 {
      @Schema({
        type: 'string',
        minimum: 1,
      })
      prop1: string;
    }

    const actualMeta = reflector.propMetadata(Model1);
    const expectedMeta: SchemaDecoratorMetadata = {
      prop1: [
        String,
        {
          type: 'string',
          minimum: 1,
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });
});
