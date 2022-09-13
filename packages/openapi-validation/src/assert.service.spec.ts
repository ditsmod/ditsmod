import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';
import { Req } from '@ditsmod/core';
import { I18nOptions, DictService, I18nLogMediator } from '@ditsmod/i18n';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { AssertUkDict } from './locales/current/uk/assert.dict';
import { AssertDict } from './locales/current';
import { AssertService } from './assert.service';
import { AssertConfig } from './assert-config';


describe('AssertService', () => {
  const config = new AssertConfig();
  let dict: AssertDict;
  let assert: AssertService;

  const req = {
    queryParams: {},
  } as Req;

  const i18nOptions: I18nOptions = {
    defaultLng: 'uk',
  };

  beforeEach(() => {
    const injector = ReflectiveInjector.resolveAndCreate([
      AssertService,
      AssertConfig,
      DictService,
      { provide: I18nLogMediator, useValue: { missingLng: jest.fn } },
      { provide: Req, useValue: req },
      { provide: I18nOptions, useValue: i18nOptions },
      { provide: AssertDict, useClass: AssertDict, multi: true },
      { provide: AssertDict, useClass: AssertUkDict, multi: true },
    ]);
    assert = injector.get(AssertService) as AssertService;
    const dictService = injector.get(DictService) as DictService;
    dict = dictService.getDictionary(AssertDict);
  });

  describe('id()', () => {
    it('case 1', () => {
      expect(() => assert.id('idParam', '')).toThrowError(`${dict.wrongNumericParam('idParam', '', 0, config.maxId)}`);
      expect(() => assert.id('idParam', '1d')).toThrowError(`${dict.wrongNumericParam('idParam', '1d', 0, config.maxId)}`);
      expect(() => assert.id('idParam', '-1')).toThrowError(`${dict.wrongNumericParam('idParam', '-1', 0, config.maxId)}`);
    });

    it('case 2', () => {
      expect(() => assert.id('idParam', '0')).not.toThrow();
      expect(() => assert.id('idParam', '1')).not.toThrow();
      expect(() => assert.id('idParam', '1111')).not.toThrow();
    });
  });

  describe('number()', () => {
    it('case 1', () => {
      expect(() => assert.number('numberParam', '', 1, 2)).toThrowError(`${dict.wrongNumericParam('numberParam', '', 1, 2)}`);
      expect(() => assert.number('numberParam', '1d', 1, 2)).toThrowError(`${dict.wrongNumericParam('numberParam', '1d', 1, 2)}`);
      expect(() => assert.number('numberParam', '0', 1, 2)).toThrowError(`${dict.wrongNumericParam('numberParam', '0', 1, 2)}`);
      expect(() => assert.number('numberParam', '-1')).toThrowError(`${dict.wrongNumericParam('numberParam', '-1', 0)}`);
      expect(() => assert.number('numberParam', '3', 1, 2)).toThrowError(`${dict.wrongNumericParam('numberParam', '3', 1, 2)}`);
    });

    it('case 2', () => {
      expect(() => assert.number('numberParam', '1', 1, 2)).not.toThrow();
      expect(() => assert.number('numberParam', '2', 1, 2)).not.toThrow();
      expect(() => assert.number('numberParam', '1')).not.toThrow();
      expect(() => assert.number('numberParam', '1111')).not.toThrow();
    });
  });

  describe('string()', () => {
    it('case 1', () => {
      expect(() => assert.string('stringParam', '', 1, 2)).toThrowError(`${dict.wrongTextParam('stringParam', 0, 1, 2)}`);
      expect(() => assert.string('stringParam', '111', 1, 2)).toThrowError(`${dict.wrongTextParam('stringParam', 3, 1, 2)}`);
      expect(() => assert.string('stringParam', '111', 2, 2)).toThrowError(`${dict.wrongTextParam('stringParam', 3, 2, 2)}`);
      expect(() => assert.string('stringParam', 1 as any, 1, 2)).toThrowError(`${dict.wrongTextParam('stringParam', 'number is not a string', 1, 2)}`);
      const msg = 'invalidUserName';
      expect(() => assert.string('stringParam', '111', 2, 2, { msg1: msg })).toThrowError(`${msg}`);
    });

    it('case 2', () => {
      expect(() => assert.string('stringParam', '')).not.toThrow();
      expect(() => assert.string('stringParam', '111')).not.toThrow();
      expect(() => assert.string('stringParam', '1', 1, 2)).not.toThrow();
      expect(() => assert.string('stringParam', '11', 1, 2)).not.toThrow();
      expect(() => assert.string('stringParam', '11', 2, 2)).not.toThrow();
    });
  });

  describe('boolean()', () => {
    it('case 1', () => {
      expect(() => assert.boolean('booleanParam', '')).toThrowError(`${dict.paramIsNotBool('booleanParam')}`);
      expect(() => assert.boolean('booleanParam', '111')).toThrowError(`${dict.paramIsNotBool('booleanParam')}`);
      expect(() => assert.boolean('booleanParam', 'aaa')).toThrowError(`${dict.paramIsNotBool('booleanParam')}`);
      expect(() => assert.boolean('booleanParam', {} as any)).toThrowError(`${dict.paramIsNotBool('booleanParam')}`);
      expect(() => assert.boolean('booleanParam', 11 as any)).toThrowError(`${dict.paramIsNotBool('booleanParam')}`);
    });

    it('case 2', () => {
      expect(() => assert.boolean('booleanParam', 'true')).not.toThrow();
      expect(() => assert.boolean('booleanParam', 'false')).not.toThrow();
      expect(() => assert.boolean('booleanParam', '0')).not.toThrow();
      expect(() => assert.boolean('booleanParam', '1')).not.toThrow();
      expect(() => assert.boolean('booleanParam', 0)).not.toThrow();
      expect(() => assert.boolean('booleanParam', 1)).not.toThrow();
      expect(() => assert.boolean('booleanParam', true)).not.toThrow();
      expect(() => assert.boolean('booleanParam', false)).not.toThrow();
    });
  });

  describe('array()', () => {
    it('case 1', () => {
      expect(() => assert.array('arrayParam', '' as any)).toThrowError(`${dict.paramIsNotArray('arrayParam')}`);
      expect(() => assert.array('arrayParam', '111' as any)).toThrowError(`${dict.paramIsNotArray('arrayParam')}`);
      expect(() => assert.array('arrayParam', {} as any)).toThrowError(`${dict.paramIsNotArray('arrayParam')}`);
      expect(() => assert.array('arrayParam', 11 as any)).toThrowError(`${dict.paramIsNotArray('arrayParam')}`);
    });

    it('case 2', () => {
      expect(() => assert.array('arrayParam', [])).not.toThrow();
      expect(() => assert.array('arrayParam', [1])).not.toThrow();
    });
  });

  describe('object()', () => {
    it('case 1', () => {
      expect(() => assert.object('objectProperty', '{}' as any)).toThrow(`${dict.itIsNotObject('objectProperty')}`);
      expect(() => assert.object('objectProperty', {})).not.toThrow();
    });
  });

  describe('convertToBool()', () => {
    it('case 1', () => {
      expect(assert.convertToBool(true)).toBe(true);
      expect(assert.convertToBool('true')).toBe(true);
      expect(assert.convertToBool('1')).toBe(true);
      expect(assert.convertToBool(1)).toBe(true);
      expect(assert.convertToBool(false)).toBe(false);
      expect(assert.convertToBool('false')).toBe(false);
      expect(assert.convertToBool('')).toBe(false);
      expect(assert.convertToBool('0')).toBe(false);
      expect(assert.convertToBool(0)).toBe(false);
    });
  });

  describe('convertToBoolNumber()', () => {
    it('case 1', () => {
      expect(assert.convertToBoolNumber(true)).toBe(1);
      expect(assert.convertToBoolNumber(false)).toBe(0);
    });
  });
});
