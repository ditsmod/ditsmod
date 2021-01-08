/**
 * Path-style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.7).
 *
 * This type can be in `path` location and can have next types:
 * - primitive
 * - array
 * - object
 */
const matrix = 'matrix';
/**
 * Label style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.7).
 *
 * This type can be in `path` location and can have next types:
 * - primitive
 * - array
 * - object
 */
const label = 'label';
/**
 * Form style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.7).
 * This option replaces `collectionFormat` with a `csv` (when `explode` is false)
 * or `multi` (when `explode` is true) value from OpenAPI 2.0.
 *
 * This type can be in `query` or `cookie` location and can have next types:
 * - primitive
 * - array
 * - object
 */
const form = 'form';
/**
 * Simple style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.7).
 * This option replaces `collectionFormat` with a `csv` value from OpenAPI 2.0.
 *
 * This type can be in `path` or `header` location and can have type `array`.
 */
const simple = 'simple';
/**
 * Space separated array values. This option replaces `collectionFormat` equal to `ssv` from OpenAPI 2.0.
 *
 * This type can be in `query` location and can have type `array`.
 */
const spaceDelimited = 'spaceDelimited';
/**
 * Pipe separated array values. This option replaces `collectionFormat` equal to `pipes` from OpenAPI 2.0.
 *
 * This type can be in `query` location and can have type `array`.
 */
const pipeDelimited = 'pipeDelimited';
/**
 * Provides a simple way of rendering nested objects using form parameters.
 *
 * This type can be in `query` location and can have type `object`.
 */
const deepObject = 'deepObject';

/**
 * In order to support common ways of serializing simple parameters, a set of style values are defined.
 */
export const oasStyles = {
  path: {
    [matrix]: matrix,
    [label]: label,
    [simple]: simple,
  },
  query: {
    [form]: form,
    [spaceDelimited]: spaceDelimited,
    [pipeDelimited]: pipeDelimited,
    [deepObject]: deepObject,
  },
  cookie: {
    [form]: form,
  },
  header: {
    [simple]: simple,
  },
} as const;

export type OasStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
