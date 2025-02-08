import { SchemaObject, XParameterObject } from '@ts-stack/openapi-spec';

import { Parameters } from './parameters.js';
import { property } from '#decorators/property.js';

describe('Parameters', () => {
  describe('without data model', () => {
    it('required path with someName', () => {
      const params = new Parameters().required('path', 'someName').getParams();
      const expectParams: XParameterObject[] = [{ in: 'path', name: 'someName', required: true }];
      expect(params).toEqual(expectParams);
    });

    it('optional cookie with otherName', () => {
      const params = new Parameters().optional('cookie', 'otherName').getParams();
      const expectParams: XParameterObject[] = [{ in: 'cookie', name: 'otherName', required: false }];
      expect(params).toEqual(expectParams);
    });

    it('required and optional params', () => {
      const params = new Parameters().required('path', 'postId').optional('cookie', 'someName').getParams();
      const expectParams: XParameterObject[] = [
        { in: 'path', name: 'postId', required: true },
        { in: 'cookie', name: 'someName', required: false },
      ];
      expect(params).toEqual(expectParams);
    });
  });

  describe('with data model', () => {
    class Model1 {
      prop1: number;
      prop2?: string;
    }

    it('required path with prop1', () => {
      const params = new Parameters().required('path', Model1, 'prop1').getParams();
      const expectParams: XParameterObject[] = [{ in: 'path', name: 'prop1', required: true }];
      expect(params).toEqual(expectParams);
    });

    it('optional cookie with prop2', () => {
      const params = new Parameters().optional('cookie', Model1, 'prop2').getParams();
      const expectParams: XParameterObject[] = [{ in: 'cookie', name: 'prop2', required: false }];
      expect(params).toEqual(expectParams);
    });

    it('required and optional params', () => {
      const params = new Parameters().required('path', Model1, 'prop1').optional('cookie', Model1, 'prop2').getParams();
      const expectParams: XParameterObject[] = [
        { in: 'path', name: 'prop1', required: true },
        { in: 'cookie', name: 'prop2', required: false },
      ];
      expect(params).toEqual(expectParams);
    });
  });

  describe('with data model and metadata of the model', () => {
    const column1: SchemaObject = { type: 'number', minimum: 0, maximum: 100 };
    const column2: SchemaObject = { type: 'string', minLength: 1, maxLength: 5 };
    class Model1 {
      @property(column1)
      prop1: number;
      @property(column2)
      prop2?: string;
    }

    it('required path with prop1', () => {
      const params = new Parameters().required('path', Model1, 'prop1').getParams();
      const expectParams: XParameterObject[] = [{ in: 'path', name: 'prop1', required: true, schema: column1 }];
      expect(params).toEqual(expectParams);
    });

    it('optional cookie with prop2', () => {
      const params = new Parameters().optional('cookie', Model1, 'prop2').getParams();
      const expectParams: XParameterObject[] = [{ in: 'cookie', name: 'prop2', required: false, schema: column2 }];
      expect(params).toEqual(expectParams);
    });

    it('required and optional params', () => {
      const params = new Parameters().required('path', Model1, 'prop1').optional('cookie', Model1, 'prop2').getParams();
      const expectParams: XParameterObject[] = [
        { in: 'path', name: 'prop1', required: true, schema: column1 },
        { in: 'cookie', name: 'prop2', required: false, schema: column2 },
      ];
      expect(params).toEqual(expectParams);
    });
  });

  describe('bindTo() and recursive()', () => {
    it('case 1', () => {
      const params = new Parameters()
        .required('path', 'postId')
        .optional('query', 'page')
        .bindTo('lastParamInPath')
        .bindTo('httpMethod', 'GET')
        .getParams();

      expect(params).toEqual([
        { in: 'path', name: 'postId', required: true },
        {
          in: 'query',
          name: 'page',
          required: false,
          'x-bound-to-path-param': false,
          'x-bound-to-http-method': 'GET',
        },
      ]);
    });
  });
});
