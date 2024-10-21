import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const openapiRoot = dirname(fileURLToPath(import.meta.resolve('@ditsmod/openapi/package.json')));

/**
 * `${openapiRoot}/ui`
 */
export const webpackDist = `${openapiRoot}/ui`;
/**
 * `${openapiRoot}/dist/swagger-ui`
 * 
 * Also see `./index.ts`
 */
export const swaggerDist = `${openapiRoot}/dist/swagger-ui`;
