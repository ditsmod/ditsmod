import { injectable, forwardRef } from '../di/index.js';
import { featureModule } from '../decorators/module.js';
import { Module3 } from './module-manager3.spec.js';

@injectable()
class Provider1 {}

// Used for circular imports modules with forwardRef()
@featureModule({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
export class Module1 {}