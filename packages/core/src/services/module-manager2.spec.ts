import { injectable } from '../di';

import { featureModule } from '../decorators/module';
import { Module3 } from './module-manager1.spec';

@injectable()
class Provider1 {}

// Used for circular imports modules without forwardRef()
@featureModule({ providersPerApp: [Provider1], imports: [Module3] })
export class Module1 {}