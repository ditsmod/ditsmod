import { injectable } from '@ts-stack/di';

import { mod } from '../decorators/module';
import { Module3 } from './module-manager1.spec';

@injectable()
class Provider1 {}

// Used for circular imports modules without forwardRef()
@mod({ providersPerApp: [Provider1], imports: [Module3] })
export class Module1 {}