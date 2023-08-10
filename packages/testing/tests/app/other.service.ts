import { injectable } from '@ditsmod/core';

@injectable()
export class OtherService {
  constructor() {}

  helloAdmin() {
    return 'Hello, admin!\n';
  }
}
