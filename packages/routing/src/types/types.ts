import {
  Class,
  HttpMethod,
  ModuleMetadata,
  ModuleType,
  NormalizedModuleMetadata,
} from '@ditsmod/core';

import { Tree } from '../services/tree.js';
import { ControllerMetadata } from './controller-metadata.js';
import { GuardPerMod1 } from '../interceptors/guard.js';
import { RouteHandler } from '../services/router.js';
import { AppendsWithParams } from '../module/module-metadata.js';
import { RoutingNormalizedModuleMetadata } from './routing-normalized-module-metadata.js';


/**
 * See also https://en.wikipedia.org/wiki/URL_redirection#HTTP_status_codes_3xx
 */
export type RedirectStatusCodes = 300 | 301 | 302 | 303 | 307 | 308;

interface ExtendedModuleMetadata extends ModuleMetadata {
  /**
   * List of modules that contain controllers. Providers and extensions from these modules
   * are not imported into the current module. If the current module has a prefix path,
   * that path will be added to each controller route from the appended modules.
   */
  appends?: Array<ModuleType | AppendsWithParams>;
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

/**
 * This metadata is generated by `RoutesExtension` group, and available for other extensions
 * that need set routes. The target for this metadata is `PreRouterExtension` group.
 */
export class MetadataPerMod3 {
  meta: RoutingNormalizedModuleMetadata;
  aControllerMetadata: ControllerMetadata[];
  guardsPerMod1: GuardPerMod1[];
}

export interface ObjectAny {
  [k: string]: any;
}

/**
 * This metadata is generated by PreRouterExtension as internal type that need only for it.
 */
export interface PreparedRouteMeta {
  moduleName: string;
  httpMethods: HttpMethod[];
  fullPath: string;
  handle: RouteHandler;
  countOfGuards: number;
}

export type Fn = (...args: any[]) => any;

export type MethodTree = { [P in HttpMethod]?: Tree };

export type Args<T> = T extends (...args: infer A) => any ? A : never;

export enum RouteType {
  static = 0,
  root = 1,
  param = 2,
  catchAll = 3,
}

export class TreeConfig {
  path?: string = '';
  wildChild?: boolean = false;
  type?: number = RouteType.static;
  indices?: string = '';
  children?: any[] = [];
  handle?: Fn | null = null;
  priority?: number = 0;
}

export interface RouteParam {
  key: string;
  value: string;
}
export type Level = 'Rou' | 'Req';
