import { getModule, ModRefId, ModuleType } from '@ditsmod/core';

import { Http2SecureServerOptions, ServerOptions } from './server-options.js';
import { ModuleWithTrpcRoutes } from './utils.js';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isModuleWithTrpcRoutes(modRefId: ModRefId): modRefId is ModRefId<ModuleWithTrpcRoutes> {
  const Mod = getModule(modRefId) as ModuleType<ModuleWithTrpcRoutes>;
  return typeof Mod.prototype.getRouterConfig == 'function';
}
