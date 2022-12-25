import { injectable } from '@ts-stack/di';

@injectable()
export class FirstMultiProviderService {
  prop = 'from FirstModule';
}