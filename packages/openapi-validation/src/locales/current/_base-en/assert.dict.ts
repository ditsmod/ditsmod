import { Dictionary, ISO639 } from '@ditsmod/i18n';

export class AssertDict implements Dictionary {
  getLng(): ISO639 {
    return 'en';
  }
  /**
   * The parameter '${param}' is not a boolean
   */
  paramIsNotBool(param: string) {
    return `The parameter '${param}' is not a boolean`;
  }
  /**
   * Invalid numeric parameter '${param}': number must be between ${min} and ${max} (actual ${actual})
   */
  wrongNumericParam(param: string, actual: number | string, min: number | string, max: number | string = 'unknown') {
    return `Invalid numeric parameter '${param}': number must be between ${min} and ${max} (actual ${actual})`;
  }
  /**
   * Invalid text parameter '${param}': text must be between ${min} and ${max} characters (actual ${actual})
   */
  wrongTextParam(param: string, actual: number | string, min: number | string, max: number | string = 'unknown') {
    return `Invalid text parameter '${param}': text must be between ${min} and ${max} characters (actual ${actual})`;
  }
  /**
   * The parameter '${param}' is not an array
   */
  paramIsNotArray(param: string) {
    return `The parameter '${param}' is not an array`;
  }
  /**
   * Too short array '${param}': it must contain from ${min} to ${max} items (got ${actual})
   */
  arrayIsTooShort(param: string, actual: number | string, min: number | string, max: number | string = 'unknown') {
    return `Too short array '${param}': it must contain from ${min} to ${max} items (got ${actual})`;
  }
  /**
   * Too long array '${param}': it must contain from ${min} to ${max} items (got ${actual})
   */
  arrayIsTooLong(param: string, actual: number | string, min: number | string, max: number | string) {
    return `Too long array '${param}': it must contain from ${min} to ${max} items (got ${actual})`;
  }
  /**
   * The parameter '${param}' is not an object
   */
  itIsNotObject(param: string) {
    return `The parameter '${param}' is not an object`;
  }
  /**
   * The parameter '${param}' does not match the pattern
   */
  wrongPatternParam(param: string) {
    return `The parameter '${param}' does not match the pattern`;
  }
  /**
   * Missing request body
   */
  missingRequestBody = 'Missing request body';
  /**
   * JSON schema not found for ajv
   */
  ajvSchemaNotFound = 'JSON schema not found for ajv';
}
