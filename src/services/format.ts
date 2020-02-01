import * as assert from 'assert-plus';

import { FormattersMap, AcceptConfig } from '../types/types';
import { Injectable } from 'ts-di';

/**
 * - Provides formatters for the `Request`
 * - Based on the client `Accept` header, sorts acceptable types by their quality values.
 * 
 * You can merge optional formatters with the default formatters to create a single
 * formatters Map. The passed in optional formatters object looks like:
 *
```ts
const formatXml: FormattersFn = (body: any) => ({ ... });
const formatSome: FormattersFn = (body: any) => ({ ... });

const formattersMap: FormattersMap = new Map()
  .set('application/xml; q=0.6', formatXml)
  .set('application/some; q=0.5', formatSome);

providersPerApp: [
// ...
{ provide: FormattersToken, useValue: formattersMap }
// ...
];
```
  * See also https://developer.mozilla.org/en-US/docs/Glossary/Quality_values
  */
@Injectable()
export class Format {
  protected acceptable: string[];
  protected formatters: FormattersMap;
  protected defaultFormatters: FormattersMap;
  protected pluginFormatters: FormattersMap;

  constructor(protected config?: AcceptConfig) {
    this.pluginFormatters = (config && config.formatters) || new Map();
    this.initFormatters();
  }

  getAcceptable() {
    return this.acceptable;
  }

  getFormatters() {
    return this.formatters;
  }

  protected initFormatters() {
    this.defaultFormatters = this.getDefaultFormatters();
    this.resetFormatters().mergeFormatters(this.pluginFormatters);
  }

  /**
   * Resetting formatters to only default formatters.
   */
  protected resetFormatters() {
    this.formatters = new Map();
    this.mergeFormatters(this.defaultFormatters);
    return this;
  }

  protected mergeFormatters(formattersMap: FormattersMap = new Map()): void {
    const mapTypePriority = new Map<string, number>();
    const arrTypePriority: Array<{ type: string; priority: number }> = [];

    new Map([...this.formatters, ...formattersMap]).forEach((formatter, type) => {
      assert.func(formatter, 'formatter');
      const { normalizedType, priority } = this.normalizeFormatterType(type);
      this.formatters.set(normalizedType, formatter);
      mapTypePriority.set(normalizedType, priority);
    });

    // Now we should sort `map` by type, and for this, we transform `map` to array of objects
    mapTypePriority.forEach((priority, type) => arrTypePriority.push({ priority, type }));

    this.acceptable = arrTypePriority.sort((a, b) => b.priority - a.priority).map(a => a.type);
  }

  protected normalizeFormatterType(inputType: string) {
    let outputType = inputType;
    let priority = 1.0;

    if (inputType.includes(';')) {
      const arrTypePriority = inputType.split(/\s*;\s*/);
      outputType = arrTypePriority[0];

      if (arrTypePriority[1].includes('q=')) {
        priority = parseFloat(arrTypePriority[1].split('=')[1]);
      }
    }

    return { normalizedType: outputType, priority };
  }

  protected getDefaultFormatters(): FormattersMap {
    return new Map()
      .set('application/json; q=0.4', this.formatJson)
      .set('text/plain; q=0.3', this.formatText)
      .set('application/octet-stream; q=0.2', this.formatBinary);
  }

  /**
   * Formats the body to 'text' by invoking a toString() on the body if it
   * exists. If it doesn't, then the response is a zero-length string.
   *
   * @param req the request object (not used)
   * @param res the response object
   * @param body response body. If it has a toString() method this
   * will be used to make the string representation
   */
  protected formatText(body: any = ''): string {
    return body.toString();
  }

  /**
   * JSON formatter `JSON.stringify()` will be attempted.
   *
   * @param req the request object (not used)
   * @param res the response object
   * @param body response body
   */
  protected formatJson(body: any): string {
    return JSON.stringify(body);
  }

  /**
   * Binary formatter.
   *
   * @param req The request object
   * @param res The response object
   * @param body Response body
   */
  protected formatBinary(body: any): Buffer {
    return Buffer.isBuffer(body) ? body : Buffer.from(body.toString());
  }
}
