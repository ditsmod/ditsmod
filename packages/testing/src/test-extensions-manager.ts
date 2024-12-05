import { ExtensionsGroupToken, ExtensionsManager, injectable, Stage1GroupMeta, Stage1GroupMeta2 } from '@ditsmod/core';

@injectable()
export class TestExtensionsManager extends ExtensionsManager {
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: false): Promise<Stage1GroupMeta<T>>;
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp: true): Promise<Stage1GroupMeta2<T>>;
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean) {
    const stage1GroupMeta = super.stage1(groupToken, perApp as true);
    return stage1GroupMeta;
  }
}
