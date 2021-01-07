/**
 * The Schema Object allows the definition of input and output data types.
 * hese types can be objects, but also primitives and arrays.
 * This object is an extended subset of the [JSON Schema Specification Wright Draft 00](https://json-schema.org/).
 * For more information about the properties, see [JSON Schema Core](https://tools.ietf.org/html/draft-wright-json-schema-00)
 * and [JSON Schema Validation](https://tools.ietf.org/html/draft-wright-json-schema-validation-00).
 * Unless stated otherwise, the property definitions follow the JSON Schema.
 */
export class OasSchema {
  /**
   * The value of "multipleOf" MUST be a number, strictly greater than 0.
   *
   * A numeric instance is only valid if division by this keyword's value results in an integer.
   */
  multipleOf?: number;
  /**
   * The value of "maximum" MUST be a number, representing an upper limit for a numeric instance.
   *
   * If the instance is a number, then this keyword validates if
   * "exclusiveMaximum" is true and instance is less than the provided
   * value, or else if the instance is less than or exactly equal to the
   * provided value.
   */
  maximum?: number;
  /**
   * The value of "exclusiveMaximum" MUST be a boolean, representing
   * whether the limit in "maximum" is exclusive or not.  An undefined
   * value is the same as false.
   *
   * If "exclusiveMaximum" is true, then a numeric instance SHOULD NOT be
   * equal to the value specified in "maximum".  If "exclusiveMaximum" is
   * false (or not specified), then a numeric instance MAY be equal to the
   * value of "maximum".
   */
  exclusiveMaximum?: boolean;
  /**
   * The value of "minimum" MUST be a number, representing a lower limit
   * for a numeric instance.
   *
   * If the instance is a number, then this keyword validates if
   * "exclusiveMinimum" is true and instance is greater than the provided
   * value, or else if the instance is greater than or exactly equal to
   * the provided value.
   */
  minimum?: number;
  /**
   * The value of "exclusiveMinimum" MUST be a boolean, representing
   * whether the limit in "minimum" is exclusive or not.  An undefined
   * value is the same as false.
   *
   * If "exclusiveMinimum" is true, then a numeric instance SHOULD NOT be
   * equal to the value specified in "minimum".  If "exclusiveMinimum" is
   * false (or not specified), then a numeric instance MAY be equal to the
   * value of "minimum".
   */
  exclusiveMinimum?: boolean;
  /**
   * The value of this keyword MUST be a non-negative integer.
   *
   * The value of this keyword MUST be an integer.  This integer MUST be
   * greater than, or equal to, 0.
   *
   * A string instance is valid against this keyword if its length is less
   * than, or equal to, the value of this keyword.
   *
   * The length of a string instance is defined as the number of its
   * characters as defined by RFC 7159 [RFC7159].
   */
  maxLength?: number;
  /**
   * A string instance is valid against this keyword if its length is
   * greater than, or equal to, the value of this keyword.
   *
   * The length of a string instance is defined as the number of its
   * characters as defined by RFC 7159 [RFC7159].
   *
   * The value of this keyword MUST be an integer.  This integer MUST be
   * greater than, or equal to, 0.
   *
   * "minLength", if absent, may be considered as being present with
   * integer value 0.
   */
  minLength?: number;
  /**
   * The value of this keyword MUST be a string.  This string SHOULD be a
   * valid regular expression, according to the ECMA 262 regular
   * expression dialect.
   *
   * A string instance is considered valid if the regular expression
   * matches the instance successfully.  Recall: regular expressions are
   * not implicitly anchored.
   */
  pattern?: string;
  /**
   * The value of this keyword MUST be an integer.  This integer MUST be
   * greater than, or equal to, 0.
   *
   * An array instance is valid against "maxItems" if its size is less
   * than, or equal to, the value of this keyword.
   */
  maxItems?: number;
  /**
   * The value of this keyword MUST be an integer.  This integer MUST be
   * greater than, or equal to, 0.
   *
   * An array instance is valid against "minItems" if its size is greater
   * than, or equal to, the value of this keyword.
   *
   * If this keyword is not present, it may be considered present with a
   * value of 0.
   */
  minItems?: number;
  /**
   * The value of this keyword MUST be a boolean.
   *
   * If this keyword has boolean value false, the instance validates
   * successfully.  If it has boolean value true, the instance validates
   * successfully if all of its elements are unique.
   *
   * If not present, this keyword may be considered present with boolean
   * value false.
   */
  uniqueItems?: boolean;
  /**
   * The value of this keyword MUST be an integer.  This integer MUST be
   * greater than, or equal to, 0.
   *
   * An object instance is valid against "maxProperties" if its number of
   * properties is less than, or equal to, the value of this keyword.
   */
  maxProperties?: number;
  /**
   * The value of this keyword MUST be an integer.  This integer MUST be
   * greater than, or equal to, 0.
   *
   * An object instance is valid against "minProperties" if its number of
   * properties is greater than, or equal to, the value of this keyword.
   *
   * If this keyword is not present, it may be considered present with a
   * value of 0.
   */
  minProperties?: number;
  /**
   * The value of this keyword MUST be an array.  This array MUST have at
   * least one element.  Elements of this array MUST be strings, and MUST
   * be unique.
   *
   * An object instance is valid against this keyword if its property set
   * contains all elements in this keyword's array value.
   */
  required?: [string, ...string[]];
  /**
   * The value of this keyword MUST be an array.  This array SHOULD have
   * at least one element.  Elements in the array SHOULD be unique.
   *
   * Elements in the array MAY be of any type, including null.
   *
   * An instance validates successfully against this keyword if its value
   * is equal to one of the elements in this keyword's array value.
   */
  enum?: any[];
  /**
   * The value of both of these keywords MUST be a string.
   *
   * Both of these keywords can be used to decorate a user interface with
   * information about the data produced by this user interface.  A title
   * will preferrably be short, whereas a description will provide
   * explanation about the purpose of the instance described by this
   * schema.
   *
   * Both of these keywords MAY be used in root schemas, and in any
   * subschemas.
   */
  title?: string;
  /**
   * Value MUST be a string. Multiple types via an array are not supported.
   */
  type?: string;
  /**
   * Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
   */
  allOf?: this;
  /**
   * Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
   */
  oneOf?: this;
  /**
   * Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
   */
  anyOf?: this;
  /**
   * Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
   */
  not?: this;
  /**
   * Value MUST be an object and not an array.
   * Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
   * Items MUST be present if the type is array.
   */
  items?: { [item: string]: OasSchema };
  /**
   * Property definitions MUST be a Schema Object and not a standard JSON Schema (inline or referenced).
   */
  properties?: this;
  /**
   * Value can be boolean or object.
   * Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
   * Consistent with JSON Schema, additionalProperties defaults to `true`.
   */
  additionalProperties?: boolean | object;
  /**
   * CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * See Data Type Formats for further details. While relying on JSON Schema's defined formats,
   * the OAS offers a few additional predefined formats.
   */
  format?: string;
  /**
   * The default value represents what would be assumed by the consumer
   * of the input as the value of the schema if one is not provided.
   * Unlike JSON Schema, the value MUST conform to the defined type for
   * the Schema Object defined at the same level. For example, if type is string,
   * then default can be "foo" but cannot be 1.
   */
  default?: any;
}
