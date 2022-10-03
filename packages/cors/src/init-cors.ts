import { CorsOptions, mergeOptions } from '@ts-stack/cors';

export function initCors(options: CorsOptions) {
  return mergeOptions(options || {});
}
