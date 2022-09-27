import 'reflect-metadata';
import { MediaTypeObject } from '@ts-stack/openapi-spec';
import { it, fit, xit, describe, expect } from '@jest/globals';

import { Property } from '../decorators/property';
import { Content } from './content';
import { REQUIRED } from '../constants';
import { inspect } from 'util';

function print(obj: any) {
  console.log(inspect(obj, undefined, null));
}

describe('Content', () => {
  it('simply model', () => {
    class Model1 {
      @Property({ [REQUIRED]: true })
      property1: string;
      @Property({ [REQUIRED]: true })
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
          required: ['property1', 'property2'],
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('array of Number', () => {
    class Model1 {
      @Property()
      property1: string;
      @Property({}, { array: Number })
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

  it('array in array', () => {
    class Model1 {
      @Property({}, { array: [String] })
      property1: string[][];
      @Property({}, { array: [String, Number] })
      property2: (string | number)[][];
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            property2: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: ['string', 'number'],
                },
              },
            },
          },
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('array in array with circular references', () => {
    class Model1 {
      @Property({}, { array: [Model1] })
      property1: Model1[][];
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: {
              type: 'array',
              items: {
                type: 'array',
                items: [
                  {
                    type: 'object',
                    properties: {
                      property1: {
                        type: 'array',
                        items: {
                          type: 'array',
                          items: [
                            {
                              type: 'object',
                              description: `[Circular references to Model1]`,
                              properties: {},
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('model with enum and array', () => {
    enum NumberEnum {
      one,
      two,
      three,
    }
    enum StringEnum {
      one = 'value1',
      two = 'value2',
      three = 3,
    }
    class Model1 {
      @Property({}, { enum: NumberEnum })
      property1: number;
      @Property({}, { enum: StringEnum })
      property2: string;
      @Property({}, { enum: [NumberEnum, StringEnum] })
      property3: number | string;
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: {
              type: 'number',
              enum: [0, 1, 2],
            },
            property2: {
              type: ['string', 'number'],
              enum: ['value1', 'value2', 3],
            },
            property3: {
              type: ['number', 'string'],
              enum: [0, 1, 2, 'value1', 'value2', 3],
            },
          },
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('wrong definition with enum and array', () => {
    enum NumberEnum {
      one,
      two,
      three,
    }
    enum StringEnum {
      one = 'value1',
      two = 'value2',
      three = 3,
    }
    class Model1 {
      @Property({}, { enum: [NumberEnum, StringEnum] })
      property1: (number | string)[];
    }

    const msg = `Wrong definition for Model1: property 'property1' is an enum or an array?`;
    expect(() => new Content().get({ mediaType: 'application/json', model: Model1 })).toThrow(msg);
  });

  it('array of Model1', () => {
    class Model1 {
      @Property()
      property1: string;
      @Property()
      property2: number;
    }

    class Model2 {
      @Property()
      property1: string;
      @Property({ type: 'array' }, { array: Model1 })
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

  it('conflict with an array definition between schema and TypeScript type', () => {
    class Model1 {
      @Property({ type: 'array' }, { array: Model1 })
      property1: Model1;
    }

    const msg = `Wrong definition for Model1: property 'property1' is an array or not array?`;
    expect(() => new Content().get({ mediaType: 'application/json', model: Model1 })).toThrow(msg);
  });

  it('array of Model1 with circular references', () => {
    class Model1 {
      @Property()
      property1: string;
      @Property({}, { array: Model1 })
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

  it('circular references', () => {
    class Model1 {
      @Property()
      property1: string;
      @Property()
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
