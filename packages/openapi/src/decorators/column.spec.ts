import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Column, ColumnDecoratorMetadata } from './column';

describe('@Column', () => {
  it('model without properties', () => {
    class Model1 {}

    expect(reflector.propMetadata(Model1)).toEqual({});
  });

  it('properly structure of model metadata with empty value', () => {
    class Model1 {
      @Column()
      prop1: string;
      @Column()
      prop2: string;
      @Column()
      @Column()
      prop3: string;
    }

    const actualMeta = reflector.propMetadata(Model1);
    // console.log(actualMeta);
    const expectedMeta: ColumnDecoratorMetadata = {
      prop1: [String, { schema: undefined, arrayModel: undefined }],
      prop2: [String, { schema: undefined, arrayModel: undefined }],
      prop3: [String, { schema: undefined, arrayModel: undefined }, { schema: undefined, arrayModel: undefined }],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('properly structure of model metadata with some value', () => {
    class Model1 {
      @Column({
        type: 'string',
        minimum: 1,
      })
      prop1: string;
    }

    const actualMeta = reflector.propMetadata(Model1);
    const expectedMeta: ColumnDecoratorMetadata = {
      prop1: [
        String,
        {
          schema: {
            type: 'string',
            minimum: 1,
          },
          arrayModel: undefined,
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });
});
