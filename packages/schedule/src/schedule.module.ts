import { featureModule } from '@holu/core';

import { ScheduleExtension } from './schedule.extension.js';
import { SchedulerOrchestrator } from './scheduler.orchestrator.js';
import { SchedulerRegistry } from './scheduler.registry.js';

@featureModule({
  providersPerApp: [SchedulerRegistry, SchedulerOrchestrator],
  extensions: [
    {
      extension: ScheduleExtension,
      exportOnly: true,
    },
  ],
})
export class ScheduleModule {}
