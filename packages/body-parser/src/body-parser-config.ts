import { HttpMethod } from '@ditsmod/core';

export class BodyParserConfig {
  acceptMethods?: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
  acceptHeaders?: string[] = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'text/html'];
  maxBodySize?: number = 1024 * 1024 * 5; // 5 MB
}

/**
 * It is used as a DI token.
 */
export class HttpBody {
  [key: string | number | symbol]: any;
}
