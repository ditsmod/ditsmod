import { injectable } from '@ditsmod/core';

@injectable()
export class SecondMultiProviderService {
  prop = 'from SecondModule';
}