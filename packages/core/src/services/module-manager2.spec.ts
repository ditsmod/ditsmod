import { Injectable } from '@ts-stack/di';

import { Module } from '../decorators/module';
import { Module3 } from './module-manager1.spec';

@Injectable()
class Provider1 {}

// Used for circular imports modules without forwardRef()
@Module({ providersPerApp: [Provider1], imports: [Module3] })
export class Module1 {}