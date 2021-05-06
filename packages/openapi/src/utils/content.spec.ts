import 'reflect-metadata';
import { inspect } from 'util';
import { MediaTypeObject } from '@ts-stack/openapi-spec';

import { Column } from '../decorators/column';
import { Content } from './content';

describe('Content', () => {
  it('simply model', () => {
    class Model1 {
      @Column()
      property1: string;
      @Column()
      property2: number;
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: {
              type: 'string',
            },
            property2: {
              type: 'number',
            },
          },
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('array', () => {
    class Model1 {
      @Column()
      property1: string;
      @Column()
      property2: number;
    }

    class Model2 {
      @Column()
      property1: string;
      @Column({ type: 'array' }, Model1)
      property2: Model1[];
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model2 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: { type: 'string' },
            property2: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  property1: { type: 'string' },
                  property2: { type: 'number' }
                }
              }
            }
          }
        },
        encoding: undefined
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('cyclic reference', () => {
    class Model1 {
      @Column()
      property1: string;
      @Column()
      property2: Model1;
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: { type: 'string' },
            property2: {
              type: 'object',
              properties: {
                property1: { type: 'string' },
                property2: {
                  type: 'object',
                  description: '[Circular references to Model1]',
                  properties: {},
                },
              },
            },
          },
        },
        encoding: undefined,
      } as MediaTypeObject,
    };

    expect(content).toEqual(expectContent);
  });
});
