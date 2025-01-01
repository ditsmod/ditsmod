import { ISO639 } from '@ditsmod/i18n';
import { AssertDict } from '../_base-en/assert.dict.js';

export class AssertUkDict extends AssertDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * Параметр '${param}' не є булевим
   */
  override paramIsNotBool(param: string) {
    return `Параметр '${param}' не є булевим`;
  }
  /**
   * Невірний цифровий параметр '${param}': число повинно бути в межах від ${min} до ${max} (зараз ${actual})
   */
  override wrongNumericParam(
    param: string,
    actual: number | string,
    min: number | string,
    max: number | string = 'unknown'
  ) {
    return `Невірний цифровий параметр '${param}': число повинно бути в межах від ${min} до ${max} (зараз ${actual})`;
  }
  /**
   * Невірний текстовий параметр '${param}': текст повинен бути в межах від ${min} до ${max} символів (зараз ${actual})
   */
  override wrongTextParam(
    param: string,
    actual: number | string,
    min: number | string,
    max: number | string = 'unknown'
  ) {
    return `Невірний текстовий параметр '${param}': текст повинен бути в межах від ${min} до ${max} символів (зараз ${actual})`;
  }
  /**
   * Параметр '${param}' не є масивом
   */
  override paramIsNotArray(param: string) {
    return `Параметр '${param}' не є масивом`;
  }
  /**
   * Закороткий масив '${param}': він повинен містити від ${min} до ${max} елементів (зараз ${actual})
   */
  override arrayIsTooShort(
    param: string,
    actual: number | string,
    min: number | string,
    max: number | string = 'unknown'
  ) {
    return `Закороткий масив '${param}': він повинен містити від ${min} до ${max} елементів (зараз ${actual})`;
  }
  /**
   * Задовгий масив '${param}': він повинен містити від ${min} до ${max} елементів (зараз ${actual})
   */
  override arrayIsTooLong(param: string, actual: number | string, min: number | string, max: number | string) {
    return `Задовгий масив '${param}': він повинен містити від ${min} до ${max} елементів (зараз ${actual})`;
  }
  /**
   * Параметр '${param}' не є об'єктом
   */
  override itIsNotObject(param: string) {
    return `Параметр '${param}' не є об'єктом`;
  }
  /**
   * Параметр '${param}' не відповідає встановленому патерну
   */
  override wrongPatternParam(param: string) {
    return `Параметр '${param}' не відповідає встановленому патерну`;
  }
  /**
   * Відсутнє тіло запиту
   */
  override missingRequestBody = 'Відсутнє тіло запиту';
  /**
   * Не знайдено JSON-схеми для ajv
   */
  override ajvSchemaNotFound = 'Не знайдено JSON-схеми для ajv';
  /**
   * Невистачає необхідного параметра '${param}' у ${paramIn}
   */
  override missingRequiredParameter(param: string, paramIn?: string) {
    return `Невистачає необхідного параметра '${param}' у ${paramIn}`;
  }
}
