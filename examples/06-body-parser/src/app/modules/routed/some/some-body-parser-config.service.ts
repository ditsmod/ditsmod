import { Injectable } from '@ts-stack/di';
import { BodyParserConfig } from '@ditsmod/core';

@Injectable()
export class SomeBodyParserConfig extends BodyParserConfig {
  override maxBodySize = 1024 * 1024; // 1 MB
}
