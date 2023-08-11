import { Provider } from '@ditsmod/core';

export type Scope = 'App' | 'Mod' | 'Rou' | 'Req';

export interface Meta {
  providersPerApp?: Provider[];
  providersPerMod?: Provider[];
  providersPerRou?: Provider[];
  providersPerReq?: Provider[];
}
