import { inject, injectable, optional } from '@ditsmod/core';
import { RAW_REQ, RawRequest } from '@ditsmod/routing';
import { Multer, MulterGroup } from '@ts-stack/multer';

import { MulterExtendedOptions } from './multer-extended-options.js';
import { checkResult } from './multer-utils.js';

@injectable()
export class MulterParser {
  constructor(
    @inject(RAW_REQ) protected rawReq: RawRequest,
    protected multer: Multer,
    @optional() protected options?: MulterExtendedOptions,
  ) {}

  /**
   * Accepts a single file from a form field with the name you pass in the `name` parameter.
   * The single file will be stored in `parsedForm.file` property.
   */
  single<F extends object = any>(name: string) {
    const result = this.multer.single<F>(name)(this.rawReq, this.rawReq.headers);
    return checkResult(result);
  }

  /**
   * Accepts an array of files from a form field with the name you pass in the `name` parameter.
   * Optionally error out if more than `maxCount` files are uploaded. The array of files will be
   * stored in `parsedForm.files` property.
   *
   * __Note__: `maxCount` limit has precedence over `limits.files`.
   */
  array<F extends object = any>(name: string, maxCount?: number) {
    const result = this.multer.array<F>(name, maxCount)(this.rawReq, this.rawReq.headers);
    return checkResult(result);
  }

  /**
   * Accepts arrays of files from any form fields, with no limit on the number of files.
   * An array of files will be stored in `parsedForm.files`.
   *
   * **WARNING:** Make sure that you always handle the files that a user uploads.
   * Never use this method as a global parser since a malicious user could upload
   * files to a route that you didn't anticipate. Only use this function on routes
   * where you are handling the uploaded files.
   */
  any<F extends object = any>() {
    const result = this.multer.any<F>()(this.rawReq, this.rawReq.headers);
    return checkResult(result);
  }

  /**
   * Accepts groups of file arrays with fields of the form you specify with the `group` parameter.
   * An object with arrays of files will be stored in `parsedForm.groups` property.
   * 
   * `groups` should be an array of objects with `name` and optionally a `maxCount`.
   * Example:
   * 
```ts
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```
   * 
   * __Note__: `maxCount` limit has precedence over `limits.files`.
   */
  groups<F extends object = any, G extends string = string>(groups: MulterGroup<G>[]) {
    const result = this.multer.groups<F, G>(groups)(this.rawReq, this.rawReq.headers);
    return checkResult(result);
  }

  /**
   * Accept only text fields. If any file upload is made, error with code
   * `LIMIT_UNEXPECTED_FILE` will be issued. This is the same as doing `parse.groups([])`.
   */
  textFields<F extends object = any>() {
    const result = this.multer.textFields<F>()(this.rawReq, this.rawReq.headers);
    return checkResult(result).then(parsedForm => parsedForm.textFields);
  }
}
