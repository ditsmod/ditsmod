import { CustomError, ErrorOpts } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { AssertConfig } from './assert-config';
import { AssertDict } from './locales/current';

@Injectable()
export class AssertService {
  #dict: AssertDict;

  private get dict(): AssertDict {
    if (!this.#dict) {
      this.#dict = this.dictService.getDictionary(AssertDict);
    }
    return this.#dict;
  }

  constructor(private config: AssertConfig, private dictService: DictService) {}

  boolean(name: string, value: boolean | string | number, opts?: ErrorOpts) {
    if (
      (typeof value != 'boolean' && typeof value != 'string' && typeof value != 'number') ||
      ((typeof value == 'string' || typeof value == 'number') &&
        value != 'true' &&
        value != 'false' &&
        value != '0' &&
        value != '1')
    ) {
      const msg1 = this.dict.paramIsNotBool(name);
      this.throwError(msg1, opts);
    }
  }

  /**
   * @param min If omit, have default value `0`.
   * @param max If omit, max will unchecked.
   */
  number(name: string, value: number | string, min: number = 0, max?: number, opts?: ErrorOpts) {
    let hasError = false;
    const param = !isNaN(parseFloat(value as string)) ? +value : NaN;
    let actual: number | string = 0;

    if (isNaN(param)) {
      actual = this.reduceParamToLog(value as string);
      hasError = true;
    } else if (param < min) {
      actual = value;
      hasError = true;
    } else if (max !== undefined && param > max) {
      actual = value;
      hasError = true;
    }

    if (hasError) {
      const msg1 = this.dict.wrongNumericParam(name, actual, min, max);
      this.throwError(msg1, opts);
    }
  }

  /**
   * @param min Minimal lengnth of the text param. If omit, have default value `0`.
   * @param max Maximal lengnth of the text param. If omit, max will unchecked.
   */
  string(name: string, value: string, min: number = 0, max?: number, opts?: ErrorOpts): void {
    let hasError = false;
    let actual: string | number = 0;
    if (typeof value != 'string') {
      actual = this.reduceParamToLog(value);
      hasError = true;
    } else if (value.length < min) {
      actual = value.length;
      hasError = true;
    } else if (max !== undefined && value.length > max) {
      actual = value.length;
      hasError = true;
    }

    if (hasError) {
      const msg1 = this.dict.wrongTextParam(name, actual, min, max);
      this.throwError(msg1, opts);
    }
  }

  /**
   * @param min Minimal lengnth of the array param. If omit, have default value `0`.
   * @param max Maximal lengnth of the array param. If omit, max will unchecked.
   */
  array(name: string, value: any[], min: number = 0, max?: number, opts?: ErrorOpts) {
    let msg1: string = '';
    if (!Array.isArray(value)) msg1 = this.dict.paramIsNotArray(name);
    else if (value.length < min) msg1 = this.dict.arrayIsTooShort(name, value.length, min, max);
    else if (max !== undefined && value.length > max) msg1 = this.dict.arrayIsTooLong(name, value.length, min, max);

    if (msg1) {
      this.throwError(msg1, opts);
    }
  }

  object(name: string, value: object, opts?: ErrorOpts) {
    if (typeof value != 'object') {
      const msg1 = this.dict.itIsNotObject(name);
      this.throwError(msg1, opts);
    }
  }

  pattern(name: string, value: string, pattern: string | RegExp, opts?: ErrorOpts) {
    if (typeof value != 'string' || !RegExp(pattern).test(value)) {
      const msg1 = this.dict.wrongPatternParam(name);
      this.throwError(msg1, opts);
    }
  }

  id(name: string, value: number | string, opts?: ErrorOpts) {
    this.number(name, value, 0, this.config.maxId, opts);
  }

  optionalId(name: string, value: number | string, opts?: ErrorOpts) {
    if (value !== undefined) {
      this.id(name, value, opts);
    }
  }

  /**
   * @param min If omit, have default value `0`.
   * @param max If omit, max will unchecked.
   */
  optionalNumber(name: string, value: number | string, min: number = 0, max?: number, opts?: ErrorOpts) {
    if (value !== undefined) {
      this.number(name, value, min, max, opts);
    }
  }

  /**
   * @param min Minimal lengnth of the text param. If omit, have default value `0`.
   * @param max Maximal lengnth of the text param. If omit, max will unchecked.
   */
  optionalString(name: string, value: string, min: number = 0, max?: number, opts?: ErrorOpts) {
    if (value !== undefined) {
      this.string(name, value, min, max, opts);
    }
  }

  optionalBoolean(name: string, value: boolean | string | number, opts?: ErrorOpts) {
    if (value !== undefined) {
      this.boolean(name, value, opts);
    }
  }

  /**
   * @param min Minimal lengnth of the text param. If omit, have default value `0`.
   * @param max Maximal lengnth of the text param. If omit, max will unchecked.
   */
  optionalArray(name: string, value: any[], min: number = 0, max?: number, opts?: ErrorOpts) {
    if (value !== undefined) {
      this.array(name, value, min, max, opts);
    }
  }

  optionalObject(name: string, value: object, opts?: ErrorOpts) {
    if (value !== undefined) {
      this.object(name, value, opts);
    }
  }

  convertToBoolNumber(value: boolean | string | number): 1 | 0 {
    return this.convertToBool(value) ? 1 : 0;
  }

  convertToBool(value: boolean | string | number): boolean {
    return !value || value == 'false' || value == '0' ? false : true;
  }

  protected reduceParamToLog(value: string) {
    if (value === undefined) {
      return 'undefined';
    } else if (typeof value != 'string') {
      return `${typeof value} is not a string`;
    } else {
      const end = value.length > this.config.maxLengthLogParam ? '...' : '';
      return value.substring(0, this.config.maxLengthLogParam) + end;
    }
  }

  protected throwError(msg1: string, opts?: ErrorOpts) {
    if (opts) {
      opts.msg1 = opts.msg1 || msg1;
      throw new CustomError(opts);
    } else {
      throw new CustomError({ msg1 });
    }
  }
}
