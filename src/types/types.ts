import { Provider, Type } from 'ts-di';

import { HttpMethod } from './router';
import { NodeRequest, NodeResponse } from './server-options';

export type RequestListener = (request: NodeRequest, response: NodeResponse) => void | Promise<void>;

/**
 * It is just `{ [key: string]: any }` an object interface.
 */
export interface ObjectAny {
  [key: string]: any;
}

export class BodyParserConfig {
  acceptMethods: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
}

export type FormattersFn = (body?: any) => string | Buffer | Uint8Array;
export type FormattersMap = Map<string, FormattersFn>;
