import { TypeProvider } from '@ts-stack/di';

import { ControllerMetadata, PreRouteData } from '../decorators/controller';
import { ModuleMetadata } from '../decorators/module';
import { HttpMethod } from './router';
import { NodeRequest, NodeResponse, Fn } from './server-options';

export type RequestListener = (request: NodeRequest, response: NodeResponse) => void | Promise<void>;

/**
 * It is just `{ [key: string]: any }` an object interface.
 */
export interface ObjectAny {
  [key: string]: any;
}

export interface MultipartBodyParserOptions {
  overrideParams?: boolean;
  multiples?: boolean;
  keepExtensions?: boolean;
  uploadDir?: string;
  maxFieldsSize?: number;
  hash?: string;
  multipartFileHandler?: Fn;
  multipartHandler?: Fn;
  mapParams?: boolean;
  mapFiles?: boolean;
}

export class BodyParserConfig {
  acceptMethods: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
  maxBodySize: number = 1024 * 1024 * 5; // 5 MB
  multipartOpts: MultipartBodyParserOptions = {};
}

export type FormattersFn = (body?: any) => string | Buffer | Uint8Array;
export type FormattersMap = Map<string, FormattersFn>;
export class ControllerErrorHandler {
  handleError(error: any) {
    throw error;
  }
}

export interface ModuleType extends TypeProvider {}

export class ExtensionMetadata {
  prefixPerMod: string;
  moduleMetadata: ModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerMetadata[];
  /**
   * Prepared data for the routes.
   */
  preRoutesData: PreRouteData[];
}
