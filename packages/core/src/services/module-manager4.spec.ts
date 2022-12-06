import { Injectable, forwardRef } from '@ts-stack/di';

import { Module } from '../decorators/module';
import { Module3 } from './module-manager3.spec';

@Injectable()
class Provider1 {}

// Used for circular imports modules with forwardRef()
@Module({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
export class Module1 {}