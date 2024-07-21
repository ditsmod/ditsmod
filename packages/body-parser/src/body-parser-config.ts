import { HttpMethod, InjectionToken } from '@ditsmod/core';
import { JsonOptions, RawOptions, TextOptions, UrlencodedOptions } from '@ts-stack/body-parser';

export class BodyParserConfig {
  acceptMethods?: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
  jsonOptions?: JsonOptions;
  textOptions?: TextOptions;
  urlencodedOptions?: UrlencodedOptions;
  rawOptions?: RawOptions;
}

/**
 * It is used as a DI token.
 */
export const HTTP_BODY = new InjectionToken<any>('HTTP_BODY');
