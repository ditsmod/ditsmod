import { Type } from 'ts-di';

import { ServerOptions, Http2SecureServerOptions, ModuleWithProviders } from '../types';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isModuleWithProviders(
  impOrExp: Type<any> | ModuleWithProviders<{}> | any[]
): impOrExp is ModuleWithProviders<{}> {
  return (impOrExp as ModuleWithProviders<{}>).module !== undefined;
}
