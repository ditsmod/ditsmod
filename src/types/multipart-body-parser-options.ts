import { AnyFn } from './mix';

export interface MultipartBodyParserOptions {
  overrideParams?: boolean;
  multiples?: boolean;
  keepExtensions?: boolean;
  uploadDir?: string;
  maxFieldsSize?: number;
  hash?: string;
  multipartFileHandler?: AnyFn;
  multipartHandler?: AnyFn;
  mapParams?: boolean;
  mapFiles?: boolean;
}
