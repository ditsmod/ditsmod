import { OasParameter } from './oas-parameter';

/**
 * The Header Object follows the structure of the
 * [Parameter Object](https://swagger.io/specification/#parameter-object) with the following changes:
 * `name` MUST NOT be specified, it is given in the corresponding `headers` map.
 * `in` MUST NOT be specified, it is implicitly in `header`.
 * All traits that are affected by the location MUST be applicable
 * to a location of `header` (for example, [style](https://swagger.io/specification/#parameter-style)).
 */
export class OasHeader extends OasParameter {}
