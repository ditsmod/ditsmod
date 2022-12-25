import { injectable } from '@ts-stack/di';

import { OtherService } from './other.service';

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
