import { Injectable } from '@ts-stack/di';
import { LogLevel } from 'bunyan';

@Injectable()
export class BunyanConfigService {
  logLevel: LogLevel = 'trace';
}
