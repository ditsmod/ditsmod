import { ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';

export class ExportedProviders {
  module: ModuleType | ModuleWithParams;
  providersPerMod: Set<ServiceProvider>;
  providersPerRou: Set<ServiceProvider>;
  providersPerReq: Set<ServiceProvider>;
}
