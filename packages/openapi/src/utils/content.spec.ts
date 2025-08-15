import { MediaTypeObject } from '@ts-stack/openapi-spec';

import { property } from '#decorators/property.js';
import { Content } from './content.js';
import { REQUIRED } from '#constants';
import { inspect } from 'util';
import { oasErrors } from '#services/openapi-error-mediator.js';

function print(obj: any) {
  console.log(inspect(obj, undefined, null));
}

describe('Content', () => {
  it('simply model', () => {
    class Model1 {
      @property({ [REQUIRED]: true })
      property1: string;
      @property({ [REQUIRED]: true })
      property2: number;
      @property({ [REQUIRED]: false })
      property3: number;
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            property1: {
              type: 'string',
              'x-required': true,
            },
            property2: {
              type: 'number',
              'x-required': true,
            },
            property3: {
              type: 'number',
              'x-required': false,
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
      @property()
      property1: string;
      @property({}, { array: Number })
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

  it('array with defined items should not rewiretes', () => {
    class Model1 {
      @property(
        {
          type: 'array',
          maxItems: 5,
          items: { type: 'string', minLength: 3, maxLength: 50 },
        },
        { array: String },
      )
      tagList: string[];
    }

    const content = new Content().get({ mediaType: 'application/json', model: Model1 });
    const expectContent = {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            tagList: {
              type: 'array',
              maxItems: 5,
              items: { type: 'string', minLength: 3, maxLength: 50 },
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
      @property({}, { array: [String] })
      property1: string[];
      @property({}, { array: [[String, Number]] })
      property2: (string | number)[][];
      @property({}, { array: [String, Number] })
      property3: (string | number)[];
      @property({}, { array: [[String]] })
      property4: string[][];
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
                type: 'string',
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
            property3: {
              type: 'array',
              items: {
                type: ['string', 'number'],
              },
            },
            property4: {
              type: 'array',
              items: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      } as MediaTypeObject,
    };
    expect(content).toEqual(expectContent);
  });

  it('array in array with circular references', () => {
    class Model1 {
      @property({}, { array: [[Model1]] })
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
                              description: '[Circular references to Model1]',
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
      @property({}, { enum: NumberEnum })
      property1: number;
      @property({}, { enum: StringEnum })
      property2: string;
      @property({}, { enum: [NumberEnum, StringEnum] })
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
      @property({}, { enum: [NumberEnum, StringEnum] })
      property1: (number | string)[];
    }

    const err = oasErrors.enumTypeDefinitionConflict('Model1', 'property1');
    expect(() => new Content().get({ mediaType: 'application/json', model: Model1 })).toThrow(err);
  });

  it('array of Model1', () => {
    class Model1 {
      @property()
      property1: string;
      @property()
      property2: number;
    }

    class Model2 {
      @property()
      property1: string;
      @property({ type: 'array' }, { array: Model1 })
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
      @property({ type: 'array' }, { array: Model1 })
      property1: Model1;
    }

    const err = oasErrors.arrayTypeDefinitionConflict('Model1', 'property1');
    expect(() => new Content().get({ mediaType: 'application/json', model: Model1 })).toThrow(err);
  });

  it('array of Model1 with circular references', () => {
    class Model1 {
      @property()
      property1: string;
      @property({}, { array: Model1 })
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
      @property()
      property1: string;
      @property()
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
