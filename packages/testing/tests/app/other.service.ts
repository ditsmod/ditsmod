import { injectable } from '@ditsmod/core';

@injectable()
export class OtherService {
  constructor() {}

  async helloAdmin() {
    return 'Hello, admin!\n';
  }
}
