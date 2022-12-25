import { injectable } from '@ts-stack/di';

@injectable()
export class OtherService {
  constructor() {}

  async helloAdmin() {
    return 'Hello, admin!\n';
  }
}
