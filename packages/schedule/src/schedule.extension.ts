import crypto from 'node:crypto';

import {
  Extension,
  injectable,
  ResolvedModuleMetadata,
  ExtensionCounters,
  Provider,
  Injector,
  Logger,
  getProviderTarget,
} from '@ditsmod/core';
import { Reflector } from '@ditsmod/core/di';

import { cron } from './cron.decorator.js';
import { interval } from './interval.decorator.js';
import { timeout } from './timeout.decorator.js';
import { SchedulerOrchestrator } from './scheduler.orchestrator.js';

@injectable()
export class ScheduleExtension implements Extension<void> {
  private readonly scannedProviders = new Set<any>();

  constructor(
    private orchestrator: SchedulerOrchestrator,
    private metadata: ResolvedModuleMetadata,
    private counters: ExtensionCounters,
    private logger: Logger,
  ) {}

  async stage1(isLastModule: boolean): Promise<void> {
    const meta = this.metadata.normalizedModuleMeta;

    // Scan providersPerRou & providersPerReq to warn if decorated
    this.scanAndWarn(meta.providersPerRou, 'route-scoped');
    this.scanAndWarn(meta.providersPerReq, 'request-scoped');

    // Collect valid static providers (module scope)
    this.collectStatic(meta.providersPerMod);

    if (isLastModule) {
      this.collectStatic(meta.providersPerApp);
    }
  }

  async stage2(injectorPerMod: Injector): Promise<void> {
    for (const ProviderCls of this.scannedProviders) {
      const instance = injectorPerMod.get(ProviderCls, null);
      if (!instance) {
        continue;
      }

      const classMeta = Reflector.collectMeta(ProviderCls);
      if (!classMeta) {
        continue;
      }

      for (const propName of classMeta) {
        const propMeta = classMeta[propName];
        propMeta.decorators.forEach((decor) => {
          const boundFn = (instance[propName] as Function).bind(instance);
          const name = decor.value.name || crypto.randomUUID();

          if (decor.decorator === cron) {
            this.orchestrator.addCron(name, boundFn, decor.value);
          } else if (decor.decorator === interval) {
            this.orchestrator.addInterval(name, boundFn, decor.value.timeout);
          } else if (decor.decorator === timeout) {
            this.orchestrator.addTimeout(name, boundFn, decor.value.timeout);
          }
        });
      }

      // Remove so we do not attempt to scan it in other modules
      this.scannedProviders.delete(ProviderCls);
    }
  }

  async stage3(): Promise<void> {
    this.orchestrator.mountJobs();
  }

  private collectStatic(providers: Provider[]): void {
    providers.forEach((prov) => {
      const target = getProviderTarget(prov);
      if (typeof target !== 'function') {
        return;
      }

      const meta = Reflector.collectMeta(target);
      if (!meta) {
        return;
      }

      for (const propName of meta) {
        const hasDecor = meta[propName].decorators.some(
          (d) => d.decorator === cron || d.decorator === interval || d.decorator === timeout,
        );
        if (hasDecor) {
          this.scannedProviders.add(target);
        }
      }
    });
  }

  private scanAndWarn(providers: Provider[], scope: string): void {
    providers.forEach((prov) => {
      const target = getProviderTarget(prov);
      if (typeof target !== 'function') {
        return;
      }

      const meta = Reflector.collectMeta(target);
      if (!meta) {
        return;
      }

      for (const propName of meta) {
        const hasDecor = meta[propName].decorators.some(
          (d) => d.decorator === cron || d.decorator === interval || d.decorator === timeout,
        );
        if (hasDecor) {
          this.logger.log(
            'warn',
            `Cannot register schedule on "${target.name}@${String(propName)}" because it is defined in a ${scope} provider.`,
          );
        }
      }
    });
  }
}
