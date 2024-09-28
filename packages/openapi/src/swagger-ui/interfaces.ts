import { AnyObj } from '@ditsmod/core';
import { SwaggerOAuthOptions } from './swagger-o-auth-options.js';

export interface SwaggerOptions {
  /**
   * This options for `SwaggerUI({...})`
   */
  initUi: SwaggerUiOptions;
  /**
   * This options for `ui.initOAuth({...})`
   */
  oauthOptions?: SwaggerOAuthOptions;
}

export interface SwaggerUIOptionsBase {
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

export interface SwaggerUiOptionsDomNode extends SwaggerUIOptionsBase {
  dom_id?: never;
  domNode: Element;
}

export interface SwaggerUiOptionsDomId extends SwaggerUIOptionsBase {
  dom_id: string;
  domNode?: never;
}

export type SwaggerUiOptions = SwaggerUiOptionsDomId | SwaggerUiOptionsDomNode;
