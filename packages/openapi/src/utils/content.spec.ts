import 'reflect-metadata';
import { MediaTypeObject } from '@ts-stack/openapi-spec';
import { it, fit, describe, expect } from '@jest/globals';

import { Column } from '../decorators/column';
import { Content } from './content';
import { REQUIRED } from '../constants';

describe('Content', () => {
  it('simply model', () => {
    class Model1 {
      @Column({ [REQUIRED]: true })
      property1: string;
      @Column({ [REQUIRED]: true })
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
          required: ['property1', 'property2']
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('array of Model1', () => {
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
                  property2: { type: 'number' },
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
  it('array of Model1 with circular references', () => {
    class Model1 {
      @Column()
      property1: string;
      @Column({ type: 'array' }, Model1)
      property2: Model1[];
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
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
                  property2: { type: 'array', description: '[Circular references to Model1]', items: {} },
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

  it('array of Number', () => {
    class Model1 {
      @Column()
      property1: string;
      @Column({ type: 'array' }, Number)
      property2: number[];
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: { type: 'string' },
            property2: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        },
        encoding: undefined,
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('circular references', () => {
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
