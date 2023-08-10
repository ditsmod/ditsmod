import { Provider } from '@ditsmod/core';

export type Scope = 'Mod' | 'Rou' | 'Req';

export interface Meta {
  providersPerMod?: Provider[];
  providersPerRou: Provider[];
  providersPerReq: Provider[];
}
