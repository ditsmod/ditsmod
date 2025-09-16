import { makeClassDecorator } from '@ditsmod/core';
import { XResponsesObject, XSecuritySchemeObject } from '@ts-stack/openapi-spec';

export interface OasGuardMetadata {
  /**
   * Defines a security scheme that can be used by the operations.
   *
   * Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter
   * or as a query parameter), mutual TLS (use of a client certificate), OAuth2's common flows
   * (implicit, password, client credentials and authorization code) as defined in [RFC6749][1], and
   * [OpenID Connect Discovery][2].
   * Please note that as of 2020, the implicit flow is about to be deprecated by
   * [OAuth 2.0 Security Best Current Practice][3]. Recommended for most use case is Authorization
   * Code Grant flow with PKCE.
   *
   * [1]: https://tools.ietf.org/html/rfc6749
   * [2]: https://tools.ietf.org/html/draft-ietf-oauth-discovery-06
   * [3]: https://tools.ietf.org/html/draft-ietf-oauth-security-topics
   */
  securitySchemeObject: XSecuritySchemeObject;
  /**
   * A container for the expected responses of an operation.
   * The container maps a HTTP response code to the expected response.
   *
   * The documentation is not necessarily expected to cover all possible HTTP response codes because
   * they may not be known in advance. However, documentation is expected to cover a successful
   * operation response and any known errors.
   *
   * The `default` MAY be used as a default response object for all HTTP codes that are not covered
   * individually by the `Responses Object`.
   *
   * The `Responses Object` MUST contain at least one response code, and if only one response code
   * is provided it SHOULD be the response for a successful operation call.
   */
  responses?: XResponsesObject;
  /**
   * A list of tags for API documentation control. Tags can be used for logical
   * grouping of operations by resources or any other qualifier.
   */
  tags?: string[];
}

export const oasGuard = makeClassDecorator((data: OasGuardMetadata) => data, 'oasGuard');
