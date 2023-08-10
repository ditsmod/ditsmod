import { injectable } from '@ditsmod/core';

import { OtherService } from './other.service';

@injectable()
export class MyService {
  constructor(protected otherService: OtherService) {}

  helloWorld() {
    return 'Hello, World!\n';
  }

  helloAdmin() {
    return this.otherService.helloAdmin();
  }
}
