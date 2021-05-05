import 'reflect-metadata';

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
      },
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
            property1: {
              type: 'string',
            },
            property2: {
              type: 'object',
              properties: {
                property2: {
                  type: 'object',
                  description: '[Circular references to Model1]',
                  properties: {},
                },
              },
            },
          },
        },
      },
    };

    expect(content).toEqual(expectContent);
  });
});
