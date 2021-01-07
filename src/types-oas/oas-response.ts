import { OasHeader } from './oas-header';
import { OasMediaType } from './oas-media-type';
import { OasLink } from './mix';
import { OasReference } from './oas-reference';

/**
 * Describes a single response from an API Operation, including design-time,
 * static `links` to operations based on the response.
 */
export class OasResponse {
  /**
   * A short description of the response.
   * [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation.
   */
  description: string;
  /**
   * Maps a header name to its definition.
   * [RFC7230](https://tools.ietf.org/html/rfc7230#page-22) states header names are case insensitive.
   * If a response header is defined with the name "Content-Type", it SHALL be ignored.
   */
  headers?: { [header: string]: OasHeader | OasReference };
  /**
   * A map containing descriptions of potential response payloads.
   * The key is a media type or [media type range](https://tools.ietf.org/html/rfc7231#appendix--d) and the value describes it.
   * For responses that match multiple keys, only the most specific key is applicable. e.g. `text/plain` overrides `text/*`
   */
  content?: { [mediaType: string]: OasMediaType };
  /**
   * A map of operations links that can be followed from the response.
   * The key of the map is a short name for the link,
   * following the naming constraints of the names for [Component Objects](https://swagger.io/specification/#components-object).
   */
  links?: { [linkName: string]: OasLink | OasReference };
}
