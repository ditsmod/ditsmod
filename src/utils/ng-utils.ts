/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Provider, Type, ValueProvider, ClassProvider, ExistingProvider, FactoryProvider } from 'ts-di';
import { format } from 'util';

/**
 * Flattens an array.
 */
export function flatten(list: any[], dst?: any[]): any[] {
  if (dst === undefined) {
    dst = list;
  }
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (Array.isArray(item)) {
      // we need to inline it.
      if (dst === list) {
        // Our assumption that the list was already flat was wrong and
        // we need to clone flat since we need to write to it.
        dst = list.slice(0, i);
      }
      flatten(item, dst);
    } else if (dst !== list) {
      dst.push(item);
    }
  }
  return dst;
}

/**
 * Flatten and normalize an array of arrays DI Providers
 */
export function normalizeProviders(providers: Provider[], arrayOfProviders: NormalizedProvider[] = []) {
  providers.forEach(provider => {
    if (provider instanceof Type) {
      arrayOfProviders.push({ provide: provider, useClass: provider });
    } else if (provider && typeof provider == 'object' && (provider as any).provide !== undefined) {
      arrayOfProviders.push(provider as NormalizedProvider);
    } else if (provider instanceof Array) {
      normalizeProviders(provider, arrayOfProviders);
    } else {
      throw new Error(format(`Invalid provider - only instances of Provider and Type are allowed, got:`, provider));
    }
  });

  return arrayOfProviders;
}

export type NormalizedProvider = ValueProvider | ClassProvider | ExistingProvider | FactoryProvider;
