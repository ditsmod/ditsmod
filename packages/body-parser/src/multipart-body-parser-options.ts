export interface MultipartBodyParserOptions {
  overrideParams?: boolean;
  multiples?: boolean;
  keepExtensions?: boolean;
  uploadDir?: string;
  maxFieldsSize?: number;
  hash?: string;
  multipartFileHandler?: (...args: any[]) => any;
  multipartHandler?: (...args: any[]) => any;
  mapParams?: boolean;
  mapFiles?: boolean;
}
