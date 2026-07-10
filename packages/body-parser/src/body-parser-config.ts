import type { HttpMethod } from '@ditsmod/core';
import { getSymbol } from '@ditsmod/core';
import type { JsonOptions, RawOptions, TextOptions, UrlencodedOptions } from '@ts-stack/body-parser';

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
export const HTTP_BODY = getSymbol('HTTP_BODY');
