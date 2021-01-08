import { OasHeader } from './oas-header';
import { OasReference } from './oas-reference';
import { OasStyle } from './oas-style';

/**
 * A single encoding definition applied to a single schema property.
 *
 * This object MAY be extended with [Specification Extensions](https://swagger.io/specification/#specification-extensions).
 */
export class OasEncoding {
  /**
   * The `Content-Type` for encoding a specific property.
   * Default value depends on the property type:
   * - for `string` with `format` being `binary` – `application/octet-stream`;
   * - for other primitive types – `text/plain`;
   * - for `object` – `application/json`;
   * - for `array` – the default is defined based on the inner type.
   *
   * The value can be a specific media type (e.g. `application/json`),
   * a wildcard media type (e.g. `image/*`), or a comma-separated list of the two types.
   */
  contentType?: string;
  /**
   * A map allowing additional information to be provided as headers,
   * for example `Content-Disposition`. `Content-Type` is described separately
   * and SHALL be ignored in this section. This property SHALL be ignored if
   * the request body media type is not a `multipart`.
   */
  headers?: { [header: string]: OasHeader | OasReference };
  /**
   * Describes how a specific property value will be serialized depending on
   * its type. See [Parameter Object](https://swagger.io/specification/#parameter-object)
   * for details on the [style](https://swagger.io/specification/#parameter-style) property.
   * The behavior follows the same values as `query` parameters, including default values.
   * This property SHALL be ignored if the request body media type is not `application/x-www-form-urlencoded`.
   */
  style?: OasStyle;
  /**
   * When this is true, property values of type `array` or `object` generate separate parameters
   * for each value of the array, or key-value-pair of the map. For other types of properties
   * this property has no effect. When [style](https://swagger.io/specification/#encoding-style)
   * is `form`, the default value is `true`. For all other styles,
   * the default value is `false`. This property SHALL be ignored if the request body media
   * type is not `application/x-www-form-urlencoded`.
   */
  explode?: boolean;
  /**
   * Determines whether the parameter value SHOULD allow reserved characters,
   * as defined by [RFC3986](https://tools.ietf.org/html/rfc3986#section-2.2) `:/?#[]@!$&'()*+,;=` to be included without percent-encoding.
   * The default value is `false`. This property SHALL be ignored if the request body media
   * type is not `application/x-www-form-urlencoded`.
   */
  allowReserved?: boolean;
  /**
   * Allows extensions to the OpenAPI Schema.
   * The field name MUST begin with `x-`, for example, `x-internal-id`.
   * The value can be `null`, a primitive, an array or an object.
   * Can have any valid JSON format value.
   */
  [xProps: string]: any;
}
