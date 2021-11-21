import { ServiceProvider } from '../types/mix';
import { getToken } from './get-tokens';

export function getProviderName(provider: ServiceProvider) {
  const token = getToken(provider);
  return `${token.name || token}`;
}