import { InjectionToken, Provider } from '@ts-stack/di';

import { NodeRequest, NodeResponse } from './server-options';

export const NodeReqToken = new InjectionToken<NodeRequest>('NodeRequest');
export const NodeResToken = new InjectionToken<NodeResponse>('NodeResponse');
export const EntitiesToken = new InjectionToken<Provider[]>('Entities');
/**
 * An injection token that allows you to provide one or more initialization functions.
 * These function are injected at application startup and executed during
 * app initialization. If any of these functions returns a Promise, initialization
 * does not complete until the Promise is resolved.
 *
 * You can, for example, create a factory function that loads language data
 * or an external configuration, and provide that function to the `AppInitializer` token.
 * That way, the function is executed during the application bootstrap process,
 * and the needed data is available on startup.
 *
 * [Copyright Google Inc](https://github.com/angular/angular/blob/9.0.1/packages/core/src/application_init.ts#L28-L27)
 */
export const AppInitializer = new InjectionToken<Array<() => void>>('Application Initializer');
