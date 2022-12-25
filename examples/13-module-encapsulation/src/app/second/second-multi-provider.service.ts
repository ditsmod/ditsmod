import { injectable } from '@ts-stack/di';

@injectable()
export class SecondMultiProviderService {
  prop = 'from SecondModule';
}