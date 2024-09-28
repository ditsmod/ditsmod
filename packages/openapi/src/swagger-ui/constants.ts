import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const openapiRoot = dirname(fileURLToPath(import.meta.resolve('@ditsmod/openapi/package.json')));

/**
 * `dist-webpack`
 */
export const webpackDist = `${openapiRoot}/dist-webpack`;
/**
 * `dist/swagger-ui`
 * 
 * Also see src/swagger-ui/index.ts
 */
export const swaggerDist = `${openapiRoot}/dist/swagger-ui`;
