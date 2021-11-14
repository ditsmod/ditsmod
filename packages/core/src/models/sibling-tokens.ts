import { ModuleType, ModuleWithParams } from '../types/mix';

export class SiblingTokens {
  module: ModuleType | ModuleWithParams;
  tokensPerMod: Set<any>;
  tokensPerRou: Set<any>;
  tokensPerReq: Set<any>;
}
