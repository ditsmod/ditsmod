import { injectable, InputLogLevel, LogMediator } from '@ditsmod/core';

@injectable()
export class AuthjsLogMediator extends LogMediator {
  message(level: InputLogLevel, msg: string) {
    this.setLog(level, msg);
  }
}
