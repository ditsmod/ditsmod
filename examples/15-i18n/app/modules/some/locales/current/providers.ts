import { Common } from './en/common';
import { CommonUk } from './uk/common';
import { Errors } from './en/errors';
import { ErrorsUk } from './uk/errors';

export default [
  // Namespace called "Common"
  { provide: Common, useClass: Common, multi: true },
  { provide: Common, useClass: CommonUk, multi: true },
  
  // Namespace called "Errors"
  { provide: Errors, useClass: Errors, multi: true },
  { provide: Errors, useClass: ErrorsUk, multi: true },
];
