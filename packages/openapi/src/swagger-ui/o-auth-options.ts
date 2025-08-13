import { AnyObj } from '@ditsmod/core';

export class SwaggerOAuthOptions {
  /**
   * Default clientId.
   */
  clientId?: string;
  /**
   * 🚨 **Never use this parameter in your production environment. It exposes cruicial security
   * information. This feature is intended for dev/test environments only.** 🚨 Default
   * clientSecret.
   */
  clientSecret?: string;
  /**
   * Realm query parameter (for oauth1) added to `authorizationUrl` and `tokenUrl`.
   */
  realm?: string;
  /**
   * RestApplication name, displayed in authorization popup.
   */
  appName?: string;
  /**
   * Scope separator for passing scopes, encoded before calling,
   * default value is a space (encoded value `%20`).
   */
  scopeSeparator?: string;
  /**
   * String array or scope separator (i.e. space) separated string of initially selected oauth
   * scopes, default is empty array.
   */
  scopes?: string;
  /**
   * Additional query parameters added to authorizationUrl and tokenUrl.
   */
  additionalQueryStringParams?: AnyObj;
  /**
   * Only activated for the `accessCode` flow.  During the `authorization_code` request to the
   * `tokenUrl`, pass the [Client Password](https://tools.ietf.org/html/rfc6749#section-2.3.1)
   * using the HTTP Basic Authentication scheme (`Authorization` header with
   * `Basic base64encode(client_id + client_secret)`).  The default is `false`.
   */
  useBasicAuthenticationWithAccessCodeGrant?: boolean;
  /**
   * Only applies to `authorizatonCode` flows.
   * [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) brings enhanced security
   * for OAuth public clients. The default is `false`.
   */
  usePkceWithAuthorizationCodeGrant?: boolean;
}
