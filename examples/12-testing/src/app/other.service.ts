import { injectable } from '@holu/core';

@injectable()
export class OtherService {
  constructor() {}

  async helloAdmin() {
    return 'Hello, admin!\n';
  }
}
