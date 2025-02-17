/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Provider, Class, ValueProvider, ClassProvider, TokenProvider, FactoryProvider, resolveForwardRef, isNormalizedProvider } from '#di';
import { format } from 'util';

/**
 * Flattens an array.
 */
export function flatten<T = any>(list: any[], dst?: any[]): T[] {
  list = (list || []).slice();
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
  providers.forEach((provider) => {
    provider = resolveForwardRef(provider);
    if (provider instanceof Class) {
      arrayOfProviders.push({ token: provider, useClass: provider });
    } else if (isNormalizedProvider(provider)) {
      arrayOfProviders.push(provider as NormalizedProvider);
    } else {
      throw new Error(format('Invalid provider - only instances of Provider and Class are allowed, got:', provider));
    }
  });

  return arrayOfProviders;
}

export type NormalizedProvider = ValueProvider | ClassProvider | TokenProvider | FactoryProvider;

export function stringify(token: any): string {
  if (typeof token == 'string') {
    return token;
  }

  if (token == null) {
    return '' + token;
  }

  if (token.overriddenName) {
    return `${token.overriddenName}`;
  }

  if (token.name) {
    return `${token.name}`;
  }

  const res = token.toString();

  if (res == null) {
    return '' + res;
  }

  const newLineIndex = res.indexOf('\n');
  return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
}
