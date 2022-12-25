import { injectable, forwardRef } from '@ts-stack/di';

import { mod } from '../decorators/module';
import { Module3 } from './module-manager3.spec';

@injectable()
class Provider1 {}

// Used for circular imports modules with forwardRef()
@mod({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
export class Module1 {}