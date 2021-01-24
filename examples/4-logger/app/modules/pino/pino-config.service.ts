import { Injectable } from '@ts-stack/di';
import { Level } from 'pino';

@Injectable()
export class PinoConfigService {
  logLevel: Level = 'trace';
}
