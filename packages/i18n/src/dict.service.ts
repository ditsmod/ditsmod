import { Req } from '@ditsmod/core';
import { Injectable, Injector } from '@ts-stack/di';

import { DictPerModService } from './dict-per-mod.service';
import { I18nLogMediator } from './i18n-log-mediator';
import { ISO639 } from './types/iso-639';
import { I18nOptions } from './types/mix';

@Injectable()
export class DictService extends DictPerModService {
  constructor(
    protected override injector: Injector,
    protected override i18nOptions: I18nOptions,
    protected override log: I18nLogMediator,
    protected req: Req,
  ) {
    super(injector, i18nOptions, log);
  }

  override set lng(lng: ISO639) {
    this._lng = lng;
  }

  /**
   * If you previously not set the locale,
   * then this getter will look at the `i18nOptions.lngQueryParam` in `this.req.queryParams`.
   */
   override get lng() {
    if (this._lng) {
      return this._lng;
    }
    const lng = this.req.queryParams[this.i18nOptions.lngParam || 'lng'];
    return lng || this.i18nOptions.defaultLng;
  }
}
