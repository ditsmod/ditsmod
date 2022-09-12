import { ISO639 } from '@ditsmod/i18n';
import { AssertDict } from '@ditsmod/openapi-validation';

export class AssertPlDict extends AssertDict {
  override getLng(): ISO639 {
    return 'pl';
  }
  /**
   * Nieprawidłowy parametr numeryczny '${param}': liczba musi mieścić się w zakresie od ${min} do ${max} (rzeczywista ${actual})
   */
   override wrongNumericParam(param: string, actual: number | string, min: number | string, max: number | string = 'unknown') {
    return `Nieprawidłowy parametr numeryczny '${param}': liczba musi mieścić się w zakresie od ${min} do ${max} (rzeczywista ${actual})`;
  }
}
