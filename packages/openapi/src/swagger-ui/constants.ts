import { join } from 'node:path';

export const openapiRoot = join(import.meta.dirname, '../..');

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
