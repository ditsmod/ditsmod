import { OasExample } from './mix';
import { OasEncoding } from './oas-encoding';
import { OasReference } from './oas-reference';
import { OasSchema } from './oas-schema';

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * This object MAY be extended with [Specification Extensions](https://swagger.io/specification/#specification-extensions).
 */
export interface OasMediaType {
  /**
   * The schema defining the content of the request, response, or parameter.
   */
  schema?: OasSchema | OasReference;
  /**
   * Example of the media type.
   * The example object SHOULD be in the correct format as specified by the media type.
   * The example `field` is mutually exclusive of the `examples` field. Furthermore,
   * if referencing a `schema` which contains an example,
   * the `example` value SHALL _override_ the example provided by the schema.
   */
  example?: any;
  /**
   * Examples of the media type.
   * Each example object SHOULD match the media type and specified schema if present.
   * The `examples` field is mutually exclusive of the `example` field. Furthermore,
   * if referencing a `schema` which contains an example, the `examples` value SHALL
   * _override_ the example provided by the schema.
   */
  examples?: { [exampleName: string]: OasExample | OasReference };
  /**
   * A map between a property name and its encoding information.
   * The key, being the property name, MUST exist in the schema as a property.
   * The encoding object SHALL only apply to `requestBody` objects when the media
   * type is `multipart` or `application/x-www-form-urlencoded`.
   */
  encoding?: { [encoding: string]: OasEncoding };
  /**
   * Allows extensions to the OpenAPI Schema.
   * The field name MUST begin with `x-`, for example, `x-internal-id`.
   * The value can be `null`, a primitive, an array or an object.
   * Can have any valid JSON format value.
   */
  [xProps: string]: any;
}
