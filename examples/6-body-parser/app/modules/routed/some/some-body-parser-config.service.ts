import { Injectable } from '@ts-stack/di';
import { BodyParserConfig } from '@ts-stack/ditsmod';

@Injectable()
export class SomeBodyParserConfig extends BodyParserConfig {
  maxBodySize = 1024 * 1024; // 1 MB
}
