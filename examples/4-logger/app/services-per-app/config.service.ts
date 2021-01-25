import { Injectable } from '@ts-stack/di';
import { Logger } from '@ts-stack/ditsmod';

@Injectable()
export class ConfigService {
  logLevel: keyof Logger = 'trace';
}
