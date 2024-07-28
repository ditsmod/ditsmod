import { CustomError, inject, injectable, NODE_REQ, NodeRequest, Status } from '@ditsmod/core';
import { Multer, MulterGroup, MulterParsedForm } from '@ts-stack/multer';

@injectable()
export class MulterHelper {
  constructor(
    @inject(NODE_REQ) protected nodeReq: NodeRequest,
    protected multer: Multer,
  ) {}

  /**
   * Accepts a single file from a form field with the name you pass in the `name` parameter.
   * The single file will be stored in `parsedForm.file` property.
   */
  async single<F extends object = any>(name: string) {
    const result = await this.multer.single<F>(name)(this.nodeReq, this.nodeReq.headers);
    return this.checkResult(result);
  }

  /**
   * Accepts an array of files from a form field with the name you pass in the `name` parameter.
   * Optionally error out if more than `maxCount` files are uploaded. The array of files will be
   * stored in `parsedForm.files` property.
   */
  async array<F extends object = any>(name: string, maxCount?: number) {
    const result = await this.multer.array<F>(name, maxCount)(this.nodeReq, this.nodeReq.headers);
    return this.checkResult(result);
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
   */
  async groups<F extends object = any, G extends string = string>(groups: MulterGroup<G>[]) {
    const result = await this.multer.groups<F, G>(groups)(this.nodeReq, this.nodeReq.headers);
    return this.checkResult(result);
  }

  /**
   * Accept only text fields. If any file upload is made, error with code
   * `LIMIT_UNEXPECTED_FILE` will be issued. This is the same as doing `upload.fields([])`.
   */
  async none<F extends object = any>() {
    const result = await this.multer.none<F>()(this.nodeReq, this.nodeReq.headers);
    return this.checkResult(result);
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
  async any<F extends object = any>() {
    const result = await this.multer.any<F>()(this.nodeReq, this.nodeReq.headers);
    return this.checkResult(result);
  }

  protected checkResult<F extends object = any, G extends string = string>(
    result: null | false | MulterParsedForm<F, G>,
  ) {
    if (result === null) {
      const msg1 = 'Multer failed to parse multipart/form-data: no body.';
      throw new CustomError({ msg1, status: Status.LENGTH_REQUIRED });
    } else if (result === false) {
      const msg1 = 'Multer failed to parse multipart/form-data: no header with multipart/form-data content type.';
      throw new CustomError({ msg1, status: Status.UNSUPPORTED_MEDIA_TYPE });
    }
    return result;
  }
}
