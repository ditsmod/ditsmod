import { ParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

import { getLastParameterObjects, getLastReferenceObjects } from './get-last-params.js';

describe('getLastReferenceObjects()', () => {
  it('uniq $ref', () => {
    const params: ReferenceObject[] = [
      {
        $ref: '#/ref1',
        description: 'one',
      },
      {
        $ref: '#/ref2',
        description: 'two',
      },
    ];
    expect(getLastReferenceObjects(params)).toEqual(params);
  });

  it('same $ref but different descriptions', () => {
    const params: ReferenceObject[] = [
      {
        $ref: '#/ref1',
        description: 'one',
      },
      {
        $ref: '#/ref1',
        description: 'two',
      },
    ];
    const expectedVal = [{ $ref: '#/ref1', description: 'two' }];
    expect(getLastReferenceObjects(params)).toEqual(expectedVal);
  });
});

describe('getLastParameterObjects()', () => {
  it('uniq names and places', () => {
    const params: ParameterObject[] = [
      {
        name: 'api_key',
        in: 'header',
      },
      {
        name: 'petId',
        in: 'path',
      },
    ];
    expect(getLastParameterObjects(params)).toEqual(params);
  });

  it('same names in different places', () => {
    const params: ParameterObject[] = [
      {
        name: 'petId',
        in: 'header',
      },
      {
        name: 'petId',
        in: 'path',
      },
    ];
    expect(getLastParameterObjects(params)).toEqual(params);
  });

  it('same names in same places', () => {
    const params: ParameterObject[] = [
      {
        name: 'petId',
        in: 'path',
        description: 'one',
      },
      {
        name: 'otherName',
        in: 'path',
      },
      {
        name: 'petId',
        in: 'path',
        description: 'two',
      },
    ];
    const expectedVal = [
      {
        name: 'otherName',
        in: 'path',
      },
      {
        name: 'petId',
        in: 'path',
        description: 'two',
      },
    ];
    expect(getLastParameterObjects(params)).toEqual(expectedVal);
  });
});
