import { HttpMethod } from '@ditsmod/core';

import { MultipartBodyParserOptions } from './multipart-body-parser-options';

export class BodyParserConfig {
  acceptMethods: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
  acceptHeaders: string[] = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'text/html'];
  maxBodySize: number = 1024 * 1024 * 5; // 5 MB
  multipartOpts: MultipartBodyParserOptions = {};
}
