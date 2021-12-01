import { ReflectiveInjector } from '@ts-stack/di';

/**
 * Used as DI token for extensions.
 */
export abstract class InjectorPerApp extends ReflectiveInjector {}