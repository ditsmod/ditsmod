import { edk } from '@ditsmod/core';

import { OasExample } from './mix';
import { OasReference } from './oas-reference';
import { OasSchema } from './oas-schema';
import { OasStyle } from './oas-style';

/**
 * Describes a single operation parameter.
 * @todo Упорядкувати посилання в описах типів (в цьому файлі)
 * на неіснуючу властивість _in_.
 */
export class OasParameter<T extends edk.AnyObj = any> {
  /**
   * The name of the parameter. Parameter names are case sensitive.
   * - If a param in `"path"`, the _name_ field MUST correspond to
   * a template expression occurring within the _path_ field in the [Paths Object](https://swagger.io/specification/#paths-object).
   * See [Path Templating](https://swagger.io/specification/#path-templating) for further information.
   * - If a param in `"header"` and the _name_ field is `"Accept"`, `"Content-Type"` or `"Authorization"`,
   * the parameter definition SHALL be ignored.
   * - For all other cases, the _name_ corresponds to the parameter name used by the _in_ property.
   */
  name: keyof T;
  /**
   * A brief description of the parameter. This could contain examples of use.
   * [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Determines whether this parameter is mandatory.
   * If the [parameter location](https://swagger.io/specification/#parameter-in) is `"path"`,
   * this property is **REQUIRED** and its value MUST be `true`. Otherwise,
   * the property MAY be included and its default value is `false`.
   */
  required?: boolean;
  /**
   * Specifies that a parameter is deprecated and SHOULD be transitioned out of usage.
   * Default value is `false`.
   */
  deprecated?: boolean;
  /**
   * Describes how the parameter value will be serialized depending on the type of the parameter value.
   * Default values (based on value of _in_):
   * - for `query` - `form`;
   * - for `path` - `simple`;
   * - for `header` - `simple`;
   * - for `cookie` - `form`.
   */
  style?: OasStyle;
  /**
   * When this is `true`, parameter values of type `array` or `object` generate separate parameters
   * for each value of the array or key-value pair of the map. For other types of parameters this
   * property has no effect. When [style](https://swagger.io/specification/#parameter-style) is `form`,
   * the default value is `true`. For all other styles, the default value is `false`.
   */
  explode?: boolean;
  /**
   * Determines whether the parameter value SHOULD allow reserved characters,
   * as defined by [RFC3986](https://tools.ietf.org/html/rfc3986#section-2.2) `:/?#[]@!$&'()*+,;=`
   * to be included without percent-encoding. This property only applies to parameters with
   * an _in_ value of `query`. The default value is `false`.
   */
  allowReserved?: boolean;
  /**
   * The schema defining the type used for the parameter.
   */
  schema?: OasSchema | OasReference;
  /**
   * Example of the parameter's potential value.
   * The example SHOULD match the specified schema and encoding properties if present.
   * The `example` field is mutually exclusive of the `examples` field. Furthermore,
   * if referencing a `schema` that contains an example, the `example` value SHALL _override_
   * the example provided by the schema. To represent examples of media types that cannot
   * naturally be represented in JSON or YAML, a string value can contain the example
   * with escaping where necessary.
   */
  example?: any;
  examples?: { [exampleName: string]: OasExample | OasReference };
}
