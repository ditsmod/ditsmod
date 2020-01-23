/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

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
