declare module 'swagger-ui' {
  interface SwaggerUIOptionsBase {
    /**
     * URL to fetch external configuration document from.
     */
    configUrl?: string;
    /**
     * Required if `domNode` is not provided. The ID of a DOM element inside
     * which `SwaggerUI` will put its user interface.
     */
    dom_id?: string;
    /**
     * Required if `dom_id` is not provided. The HTML DOM element inside
     * which `SwaggerUI` will put its user interface. Overrides `dom_id`.
     */
    domNode?: Element;
    /**
     * A JavaScript object describing the OpenAPI definition. When used,
     * the `url` parameter will not be parsed. This is useful for
     * testing manually-generated definitions without hosting them.
     */
    spec?: object;
    /**
     * The URL pointing to API definition (normally `swagger.json` or `swagger.yaml`).
     * Will be ignored if `urls` or `spec` is used.
     */
    url?: string;
    /**
     * An array of API definition objects (`[{url: "<url1>", name: "<name1>"},{url: "<url2>", name: "<name2>"}]`)
     * used by Topbar plugin. When used and Topbar plugin is enabled, the `url` parameter will not be parsed.
     * Names and URLs must be unique among all items in this array, since they're used as identifiers.
     */
    urls?: { url: string; name: string }[];
    /**
     * When using `urls`, you can use this subparameter. If the value matches the name of a spec provided in `urls`,
     * that spec will be displayed when Swagger UI loads, instead of defaulting to the first spec in `urls`.
     */
    ['urls.primaryName']?: string;
    /**
     * Enables overriding configuration parameters via URL search params.
     */
    queryConfigEnabled?: boolean;
  }

  interface SwaggerUIOptionsDomNode extends SwaggerUIOptionsBase {
    dom_id?: never;
    domNode: Element;
  }

  interface SwaggerUIOptionsDomId extends SwaggerUIOptionsBase {
    dom_id: string;
    domNode?: never;
  }

  type SwaggerUIOptions = SwaggerUIOptionsDomId | SwaggerUIOptionsDomNode;

  interface InitOAuthOptions {
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
    additionalQueryStringParams?: object;
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

  declare function swaggerUI(options: SwaggerUIOptions): { initOAuth: (options: InitOAuthOptions) => void };

  export default swaggerUI;
}
