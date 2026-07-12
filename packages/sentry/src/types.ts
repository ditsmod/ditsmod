import type { RouteMeta } from '@ditsmod/rest';

export interface SentryRouteMeta extends RouteMeta {
  fullPath?: string;
}

export class SentryOptions {
  capture4xx?: boolean = false;
}
