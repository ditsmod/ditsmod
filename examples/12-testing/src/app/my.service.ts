import { injectable } from '@ditsmod/core';

import { OtherService } from './other.service.js';

@injectable()
export class MyService {
  constructor(protected otherService: OtherService) {}

  async helloWorld() {
    return 'Hello, World!\n';
  }

  async helloAdmin() {
    return this.otherService.helloAdmin();
  }
}
